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

/**
 * Pull the Google Sheet's published CSV and MERGE it into the Supabase registry.
 * Shared by the server action (in-app Sync button) and the REST route (cron/external).
 * Strategy: validate the sheet layout, then upsert-by-id only (additive) — new
 * rows are inserted and existing rows are updated, but rows that are missing from
 * the sheet are NEVER deleted. Sync can add and edit, never remove.
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
  if (records.length === 0) {
    return { ok: false, status: 422, error: "Parsed 0 records from the sheet — nothing to sync. Check the tab (gid)." };
  }

  // Snapshot the existing ids first, so after the upsert we can report which
  // rows are genuinely NEW (added) rather than edits to existing rows.
  const existingIds = new Set<number>();
  for (let from = 0; ; from += 1000) {
    const { data: idRows, error: idErr } = await supabase
      .from(TABLE_NAME)
      .select("id")
      .order("id")
      .range(from, from + 999);
    if (idErr) break; // best-effort; the upsert below surfaces real table errors
    for (const row of idRows ?? []) existingIds.add(Number((row as { id: number }).id));
    if (!idRows || idRows.length < 1000) break;
  }

  // 3) Additive merge: upsert-by-id only. New ids are inserted, existing ids are
  //    updated. We intentionally DO NOT delete, so rows removed from the sheet
  //    are kept in the database — sync can add and edit, but never removes.
  const data = records.map(recordToRow);
  for (let i = 0; i < data.length; i += CHUNK) {
    const { error } = await supabase.from(TABLE_NAME).upsert(data.slice(i, i + CHUNK), { onConflict: "id" });
    if (error) {
      return {
        ok: false,
        status: 500,
        error: `Supabase upsert failed at row ${i + 1}: ${error.message}. The table may be partially updated — re-run sync.`,
        hint: "Run db/schema.sql in the Supabase SQL editor first to create the nttc_registry table.",
      };
    }
  }

  // Report the additions (rows whose id wasn't in the table before this sync),
  // trimmed to the fields the "added" modal shows.
  const added: AddedRecord[] = records
    .filter((r) => !existingIds.has(r.id))
    .map((r) => ({
      id: r.id,
      name: lastFirst(r),
      sector: normalizeValue("Q", field(r, "Q")),
      qualification: normalizeValue("R", field(r, "R")),
      cln: field(r, "AE"),
      validity: formatDate(field(r, "AD")),
      status: validityStatus(r),
    }));

  return { ok: true, count: records.length, added, syncedAt: new Date().toISOString() };
}

export { SHEET_ID, SHEET_GID };
