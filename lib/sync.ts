import "server-only";
import { getSupabaseAdminClient, canSyncToSupabase } from "./supabase";
import { parseCsv, rowsToRecords, validateNttcHeader, googleSheetCsvUrl } from "./csv";
import { COLUMNS, TABLE_NAME, LETTER_TO_KEY, type NttcRecord } from "./columns";
import { normalizeValue } from "./normalize";
import { field, lastFirst, formatDate, parseDate, validityStatus, type ValidityStatus } from "./nttc";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1TnNdv5nC_4PHjnws9aL6CpBd6Nvz--E3P3dZxRR37A4";
const SHEET_GID = process.env.GOOGLE_SHEET_GID || "1031452427";
const CHUNK = 500;
const UPDATE_CONCURRENCY = 5;
const UPDATE_RETRIES = 2;

/**
 * Sheet-authoritative columns that are updated in place when a person already
 * exists in Supabase: sector, certificate numbers/dates (NC, TM, NTTC), CLN,
 * and assessors. Identity columns (names, qualification) and personal
 * contact/background fields (address, email, institution, …) are deliberately
 * NOT in this list — the registry often holds richer values there than the sheet.
 */
const UPDATE_LETTERS = [
  "Q", "S", "T", "U", "V", "W", "X", "Y", "Z", "AA", "AB", "AC", "AD", "AE",
] as const;
const UPDATE_KEYS = UPDATE_LETTERS.map((l) => LETTER_TO_KEY[l]);

/** Date-valued columns compared semantically ("02/24/2022" == "February 24, 2022"). */
const DATE_LETTERS = new Set(["T", "U", "W", "X", "AC", "AD"]);

/** True when a sheet value is a real change (not a formatting/case-only variant). */
function valuesDiffer(letter: string, sheetV: string, dbV: string | null): boolean {
  if (dbV === null) return true;
  if (DATE_LETTERS.has(letter)) {
    const a = parseDate(sheetV);
    const b = parseDate(dbV);
    if (a && b) return a.getTime() !== b.getTime();
  }
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toUpperCase();
  return norm(sheetV) !== norm(dbV);
}

/** A newly-inserted or updated row, trimmed to the fields shown in the sync-results modal. */
export interface AddedRecord {
  id: number;
  name: string;
  sector: string;
  qualification: string;
  cln: string;
  validity: string; // formatted NTTC expiration date (or "—")
  status: ValidityStatus;
}

export type SyncResult =
  | { ok: true; count: number; added: AddedRecord[]; updated: AddedRecord[]; syncedAt: string }
  | { ok: false; status: number; error: string; hint?: string };

/** Translate a letter-keyed record into a snake_case Supabase row. */
function recordToRow(rec: NttcRecord): Record<string, unknown> {
  const row: Record<string, unknown> = { id: rec.id };
  for (const col of COLUMNS) {
    const v = (rec[col.letter] as string | null) ?? null;
    row[col.key] = v === null ? null : normalizeValue(col.letter, v);
  }
  return row;
}

/** Accent/case-insensitive identity for a person + qualification row. */
const normKey = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toUpperCase();
const personKey = (last: string, first: string, qual: string) =>
  `${normKey(last)}|${normKey(first)}|${normKey(qual)}`;

/**
 * Pull the Google Sheet's published CSV and sync it into Supabase.
 * Shared by the server action (in-app Sync button) and the REST route (cron/external).
 *
 * Supabase is the source of truth. Sheet people NOT already present (matched by
 * last name + first name + qualification, accent-insensitive) are APPENDED with
 * fresh ids after the current max. People already present get their
 * sheet-authoritative columns (UPDATE_LETTERS) UPDATED in place — empty sheet
 * cells never clear existing values, and formatting-only differences are
 * ignored. We never overwrite rows by position and never delete anything.
 */
export async function syncRegistryFromSheet(): Promise<SyncResult> {
  if (!canSyncToSupabase) {
    return {
      ok: false,
      status: 503,
      error:
        "Supabase is not configured for writes. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    };
  }
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, status: 503, error: "Could not initialise the Supabase admin client." };

  // 1) Fetch the published CSV.
  const url = googleSheetCsvUrl(SHEET_ID, SHEET_GID);
  let csv: string;
  try {
    const res = await fetch(url, { redirect: "follow", cache: "no-store" });
    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    csv = await res.text();
    if (!res.ok) return { ok: false, status: 502, error: `Google Sheets responded with HTTP ${res.status}.` };
    const head = csv.trimStart().slice(0, 200).toLowerCase();
    const looksHtml =
      contentType.includes("text/html") ||
      head.startsWith("<!doctype") ||
      head.startsWith("<html") ||
      head.includes("<head");
    if (looksHtml) {
      return {
        ok: false,
        status: 502,
        error:
          'Google returned an HTML page instead of CSV. Share the sheet as "Anyone with the link can view".',
      };
    }
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: `Failed to fetch the Google Sheet: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // 2) Parse + validate layout before writing anything.
  const rows = parseCsv(csv);
  const headerError = validateNttcHeader(rows);
  if (headerError) return { ok: false, status: 422, error: headerError };

  const records = rowsToRecords(rows);
  // Keep only rows with a real name — the sheet is padded with hundreds of
  // province-only template rows that must never be imported.
  const named = records.filter((r) => field(r, "C") || field(r, "D"));
  if (named.length === 0) {
    return { ok: false, status: 422, error: "Found 0 named people in the sheet — nothing to sync. Check the tab (gid)." };
  }

  // 3) Load the existing registry (identity keys + the sheet-authoritative
  //    columns) and the current max id. Supabase is the source of truth:
  //    new people are appended, matched people are updated in place.
  type ExistingRow = { id: number } & Record<string, string | null>;
  const existingByKey = new Map<string, ExistingRow[]>();
  const SELECT_COLS = ["id", "last_name", "first_name", "qualification", ...UPDATE_KEYS].join(", ");
  let maxId = 0;
  for (let from = 0; ; from += 1000) {
    const { data: dbRows, error: dbErr } = await supabase
      .from(TABLE_NAME)
      .select(SELECT_COLS)
      .order("id")
      .range(from, from + 999);
    if (dbErr) {
      return {
        ok: false,
        status: 500,
        error: `Could not read the existing registry: ${dbErr.message}.`,
        hint: "Run db/schema.sql in the Supabase SQL editor first to create the nttc_registry table.",
      };
    }
    for (const row of dbRows ?? []) {
      const r = row as unknown as ExistingRow;
      // Normalize qualification on BOTH sides of the key so it matches the form
      // recordToRow stores — otherwise normalized rows never match and re-append.
      const key = personKey(r.last_name ?? "", r.first_name ?? "", normalizeValue("R", r.qualification ?? ""));
      const list = existingByKey.get(key);
      if (list) list.push(r);
      else existingByKey.set(key, [r]);
      if (r.id > maxId) maxId = r.id;
    }
    if (!dbRows || dbRows.length < 1000) break;
  }

  // Pick the new people (not already present, and de-duped within the sheet) and
  // give them fresh ids appended after the current max.
  const toInsert: NttcRecord[] = [];
  const claimedKeys = new Set<string>();
  for (const r of named) {
    const key = personKey(field(r, "C"), field(r, "D"), normalizeValue("R", field(r, "R")));
    if (existingByKey.has(key) || claimedKeys.has(key)) continue;
    claimedKeys.add(key);
    maxId += 1;
    toInsert.push({ ...r, id: maxId });
  }

  // 3b) For people already in the registry, diff the sheet-authoritative columns
  //     and collect real changes. Empty sheet cells never clear a stored value,
  //     and date/case/whitespace formatting differences are not changes. When a
  //     person matches several registry rows, each row is kept in step.
  const updates: { id: number; changes: Record<string, string> }[] = [];
  const updatedRecords: AddedRecord[] = [];
  const diffedKeys = new Set<string>();
  for (const r of named) {
    const key = personKey(field(r, "C"), field(r, "D"), normalizeValue("R", field(r, "R")));
    const matches = existingByKey.get(key);
    if (!matches || diffedKeys.has(key)) continue;
    diffedKeys.add(key);
    for (const dbRow of matches) {
      const changes: Record<string, string> = {};
      for (const letter of UPDATE_LETTERS) {
        const raw = field(r, letter);
        if (!raw) continue;
        const sheetV = normalizeValue(letter, raw);
        const dbRaw = dbRow[LETTER_TO_KEY[letter]] ?? null;
        const dbV = dbRaw === null ? null : normalizeValue(letter, dbRaw);
        if (valuesDiffer(letter, sheetV, dbV)) changes[LETTER_TO_KEY[letter]] = sheetV;
      }
      if (Object.keys(changes).length === 0) continue;
      updates.push({ id: dbRow.id, changes });
      // The row's state after the update, for the sync-results modal.
      const finalV = (letter: string) => changes[LETTER_TO_KEY[letter]] ?? dbRow[LETTER_TO_KEY[letter]] ?? "";
      updatedRecords.push({
        id: dbRow.id,
        name: lastFirst(r),
        sector: normalizeValue("Q", finalV("Q")),
        qualification: normalizeValue("R", dbRow.qualification ?? ""),
        cln: finalV("AE"),
        validity: formatDate(finalV("AD")),
        status: validityStatus({ id: dbRow.id, AD: finalV("AD") } as NttcRecord),
      });
    }
  }

  // Append (insert) only the new rows. No positional overwrites, no deletes.
  const data = toInsert.map(recordToRow);
  for (let i = 0; i < data.length; i += CHUNK) {
    const { error } = await supabase.from(TABLE_NAME).upsert(data.slice(i, i + CHUNK), { onConflict: "id" });
    if (error) {
      return {
        ok: false,
        status: 500,
        error: `Supabase insert failed at row ${i + 1}: ${error.message}. Some rows may have been added — re-run sync (it is idempotent).`,
        hint: "Run db/schema.sql in the Supabase SQL editor first to create the nttc_registry table.",
      };
    }
  }

  // Apply the in-place updates in small concurrent batches, retrying each row
  // a couple of times — long runs occasionally hit transient socket resets.
  const applyUpdate = async (u: { id: number; changes: Record<string, string> }) => {
    let lastMessage = "";
    for (let attempt = 0; attempt <= UPDATE_RETRIES; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 500 * attempt));
      try {
        const { error } = await supabase.from(TABLE_NAME).update(u.changes).eq("id", u.id);
        if (!error) return null;
        lastMessage = error.message;
      } catch (err) {
        lastMessage = err instanceof Error ? err.message : String(err);
      }
    }
    return `row id ${u.id}: ${lastMessage}`;
  };
  for (let i = 0; i < updates.length; i += UPDATE_CONCURRENCY) {
    const batch = updates.slice(i, i + UPDATE_CONCURRENCY);
    const failures = (await Promise.all(batch.map(applyUpdate))).filter(Boolean);
    if (failures.length > 0) {
      return {
        ok: false,
        status: 500,
        error: `Supabase update failed (${failures[0]}). Some updates may have been applied — re-run sync (it is idempotent).`,
      };
    }
  }

  const added: AddedRecord[] = toInsert.map((r) => ({
    id: r.id,
    name: lastFirst(r),
    sector: normalizeValue("Q", field(r, "Q")),
    qualification: normalizeValue("R", field(r, "R")),
    cln: field(r, "AE"),
    validity: formatDate(field(r, "AD")),
    status: validityStatus(r),
  }));

  return { ok: true, count: named.length, added, updated: updatedRecords, syncedAt: new Date().toISOString() };
}

export { SHEET_ID, SHEET_GID };
