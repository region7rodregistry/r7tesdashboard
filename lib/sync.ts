import "server-only";
import { getSupabaseAdminClient, canSyncToSupabase } from "./supabase";
import { parseCsv, rowsToRecords, validateNttcHeader, googleSheetCsvUrl } from "./csv";
import { COLUMNS, TABLE_NAME, type NttcRecord } from "./columns";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "15FtN632uFrs-CvaruK3XtvJvHYotfrvsahRNIxL0peY";
const SHEET_GID = process.env.GOOGLE_SHEET_GID || "0";
const CHUNK = 500;

export type SyncResult =
  | { ok: true; count: number; syncedAt: string }
  | { ok: false; status: number; error: string; hint?: string };

/** Translate a letter-keyed record into a snake_case Supabase row. */
function recordToRow(rec: NttcRecord): Record<string, unknown> {
  const row: Record<string, unknown> = { id: rec.id };
  for (const col of COLUMNS) {
    row[col.key] = (rec[col.letter] as string | null) ?? null;
  }
  return row;
}

/**
 * Pull the Google Sheet's published CSV and overwrite the Supabase registry.
 * Shared by the server action (in-app Sync button) and the REST route (cron/external).
 * Strategy: validate the sheet layout, then upsert-by-id and prune ids beyond the
 * new max — so the table is never empty mid-run and shrinks are reflected.
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

  // 3) Overwrite (upsert-then-prune).
  const data = records.map(recordToRow);
  const maxId = records.length;
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
  const { error: pruneError } = await supabase.from(TABLE_NAME).delete().gt("id", maxId);
  if (pruneError) {
    return { ok: false, status: 500, error: `Synced rows but failed to prune stale rows: ${pruneError.message}` };
  }

  return { ok: true, count: records.length, syncedAt: new Date().toISOString() };
}

export { SHEET_ID, SHEET_GID };
