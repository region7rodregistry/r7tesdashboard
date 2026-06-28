import "server-only";
import localUtpras from "@/data/utpras.json";
import {
  UTPRAS_COLUMNS,
  UTPRAS_TABLE_NAME,
  type UtprasRecord,
} from "./utpras-columns";
import { computeUtprasStatistics, type UtprasStatsData } from "./utpras-stats";
import { getSupabaseReadClient } from "./supabase";

export interface UtprasSource {
  records: UtprasRecord[];
  source: "supabase" | "local";
}

const localTyped = localUtpras as unknown as UtprasRecord[];

/** Translate a Supabase row (snake_case keys) into a UtprasRecord. */
function rowToRecord(row: Record<string, unknown>, fallbackId: number): UtprasRecord {
  const rec: UtprasRecord = {
    id: Number(row.id ?? fallbackId),
    source_sheet: row.source_sheet == null ? null : String(row.source_sheet),
  };
  for (const col of UTPRAS_COLUMNS) {
    const v = row[col.key];
    rec[col.key] = v === null || v === undefined ? null : String(v);
  }
  return rec;
}

/**
 * Load the UTPRAS registry. Prefers Supabase when configured; otherwise serves
 * the bundled snapshot (data/utpras.json) so the tab works out of the box.
 * Falls back to the snapshot if a Supabase query errors OR returns zero rows
 * (table not created / not seeded / RLS blocking reads) — so the page is never
 * blank.
 */
async function loadUtpras(): Promise<UtprasSource> {
  const supabase = getSupabaseReadClient();
  if (!supabase) {
    return { records: localTyped, source: "local" };
  }

  const selectCols = ["id", "source_sheet", ...UTPRAS_COLUMNS.map((c) => c.key)].join(", ");

  // PostgREST caps each response at ~1000 rows, so a single .select() silently
  // truncates large tables. Page through with .range() until a short page tells
  // us we've reached the end, then concatenate.
  const PAGE = 1000;
  const data: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabase
      .from(UTPRAS_TABLE_NAME)
      .select(selectCols)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      console.error(
        `[utpras] Supabase read failed (${error.message}). ` +
          `Run db/utpras_schema.sql + db/utpras_seed.sql in Supabase. Serving local snapshot.`,
      );
      return { records: localTyped, source: "local" };
    }

    const rows = (page ?? []) as unknown as Record<string, unknown>[];
    data.push(...rows);
    if (rows.length < PAGE) break;
  }

  if (data.length === 0) {
    console.warn(
      "[utpras] Supabase '" +
        UTPRAS_TABLE_NAME +
        "' returned 0 rows — table is empty, not created, or RLS is blocking anon reads. " +
        "Run db/utpras_schema.sql + db/utpras_seed.sql (and allow anon SELECT). Serving local snapshot.",
    );
    return { records: localTyped, source: "local" };
  }

  const records = data.map((row, i) => rowToRecord(row, i + 1));
  return { records, source: "supabase" };
}

// Memoize in-process with a short TTL so repeated reads don't re-query Supabase
// on every render (mirrors lib/data.ts for the NTTC registry).
let utprasMemo: { at: number; value: UtprasSource } | null = null;
const UTPRAS_TTL_MS = 60_000;

/** Load the full UTPRAS registry (every record), memoized in-process for ~60s. */
export async function getUtprasRegistry(): Promise<UtprasSource> {
  const now = Date.now();
  if (utprasMemo && now - utprasMemo.at < UTPRAS_TTL_MS) {
    return utprasMemo.value;
  }
  const value = await loadUtpras();
  utprasMemo = { at: now, value };
  return value;
}

/** Drop the in-process UTPRAS memo. */
export function invalidateUtprasCache(): void {
  utprasMemo = null;
}

export interface UtprasStatistics {
  source: UtprasSource["source"];
  data: UtprasStatsData;
}

/**
 * Pre-aggregated UTPRAS statistics for the charts. Computed from the memoized
 * registry read, so the page ships only the small aggregates (never the full
 * record set) and stays in lockstep with the Programs tab.
 */
export async function getUtprasStatistics(): Promise<UtprasStatistics> {
  const { records, source } = await getUtprasRegistry();
  return { source, data: computeUtprasStatistics(records) };
}
