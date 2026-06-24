import "server-only";
import { getSupabaseAdminClient, canSyncToSupabase } from "./supabase";
import { parseCsv, rowsToRecords, validateNttcHeader, googleSheetCsvUrl } from "./csv";
import { COLUMNS, TABLE_NAME, type NttcRecord } from "./columns";
import { normalizeValue } from "./normalize";
import { field, lastFirst, formatDate, validityStatus, type ValidityStatus } from "./nttc";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "15FtN632uFrs-CvaruK3XtvJvHYotfrvsahRNIxL0peY";
const SHEET_GID = process.env.GOOGLE_SHEET_GID || "0";
const CHUNK = 500;

/** A newly-inserted row, trimmed to the fields shown in the "added" modal. */
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
  | { ok: true; count: number; added: AddedRecord[]; syncedAt: string }
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
 * Pull the Google Sheet's published CSV and APPEND new people into Supabase.
 * Shared by the server action (in-app Sync button) and the REST route (cron/external).
 *
 * Supabase is the source of truth. We add only the sheet people who are NOT already
 * present (matched by last name + first name + qualification, accent-insensitive),
 * giving them fresh ids after the current max. We never overwrite existing rows by
 * position and never delete anything — sync only appends.
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

  // 3) Load the existing registry's identity keys + current max id. Supabase is
  //    the source of truth, so we only APPEND people not already present.
  const existingKeys = new Set<string>();
  let maxId = 0;
  for (let from = 0; ; from += 1000) {
    const { data: dbRows, error: dbErr } = await supabase
      .from(TABLE_NAME)
      .select("id, last_name, first_name, qualification")
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
      const r = row as { id: number; last_name: string | null; first_name: string | null; qualification: string | null };
      // Normalize qualification on BOTH sides of the key so it matches the form
      // recordToRow stores — otherwise normalized rows never match and re-append.
      existingKeys.add(personKey(r.last_name ?? "", r.first_name ?? "", normalizeValue("R", r.qualification ?? "")));
      if (r.id > maxId) maxId = r.id;
    }
    if (!dbRows || dbRows.length < 1000) break;
  }

  // Pick the new people (not already present, and de-duped within the sheet) and
  // give them fresh ids appended after the current max.
  const toInsert: NttcRecord[] = [];
  for (const r of named) {
    const key = personKey(field(r, "C"), field(r, "D"), normalizeValue("R", field(r, "R")));
    if (existingKeys.has(key)) continue;
    existingKeys.add(key);
    maxId += 1;
    toInsert.push({ ...r, id: maxId });
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

  const added: AddedRecord[] = toInsert.map((r) => ({
    id: r.id,
    name: lastFirst(r),
    sector: normalizeValue("Q", field(r, "Q")),
    qualification: normalizeValue("R", field(r, "R")),
    cln: field(r, "AE"),
    validity: formatDate(field(r, "AD")),
    status: validityStatus(r),
  }));

  return { ok: true, count: named.length, added, syncedAt: new Date().toISOString() };
}

export { SHEET_ID, SHEET_GID };
