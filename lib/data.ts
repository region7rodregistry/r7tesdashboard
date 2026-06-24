import "server-only";
import { unstable_cache } from "next/cache";
import localRecords from "@/data/records.json";
import { COLUMNS, KEY_TO_LETTER, TABLE_NAME, type NttcRecord } from "./columns";
import { normalizeRecord, normalizeValue } from "./normalize";
import { computeStatistics, type StatsData } from "./stats";
import { getSupabaseReadClient } from "./supabase";

export interface RegistrySource {
  records: NttcRecord[];
  source: "supabase" | "local";
}

/** Translate a snake_case Supabase row into a letter-keyed NttcRecord. */
function rowToRecord(row: Record<string, unknown>, fallbackId: number): NttcRecord {
  const rec: NttcRecord = { id: Number(row.id ?? fallbackId) };
  for (const col of COLUMNS) {
    const v = row[col.key];
    rec[col.letter] =
      v === null || v === undefined ? null : normalizeValue(col.letter, String(v));
  }
  return rec;
}

const localTyped = (localRecords as unknown as NttcRecord[]).map(normalizeRecord);

/**
 * Load the registry. Prefers Supabase when configured; otherwise serves the
 * bundled snapshot so the dashboard works out of the box. Falls back to the
 * snapshot if a Supabase query errors OR returns zero rows (table not created /
 * not seeded / RLS blocking reads) — so the dashboard is never blank.
 */
async function loadRegistry(): Promise<RegistrySource> {
  const supabase = getSupabaseReadClient();
  if (!supabase) {
    return { records: localTyped, source: "local" };
  }

  const selectCols = ["id", ...COLUMNS.map((c) => c.key)].join(", ");

  // PostgREST caps each response at ~1000 rows, so a single .select() silently
  // truncates large tables. Page through with .range() until a short page tells
  // us we've reached the end, then concatenate.
  const PAGE = 1000;
  const data: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabase
      .from(TABLE_NAME)
      .select(selectCols)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      console.error(
        `[data] Supabase read failed (${error.message}). ` +
          `Run db/schema.sql + db/seed.sql in Supabase. Serving local snapshot.`,
      );
      return { records: localTyped, source: "local" };
    }

    const rows = (page ?? []) as unknown as Record<string, unknown>[];
    data.push(...rows);
    if (rows.length < PAGE) break;
  }

  if (data.length === 0) {
    console.warn(
      "[data] Supabase '" +
        TABLE_NAME +
        "' returned 0 rows — table is empty, not created, or RLS is blocking anon reads. " +
        "Run db/schema.sql + db/seed.sql (and allow anon SELECT or disable RLS). Serving local snapshot.",
    );
    return { records: localTyped, source: "local" };
  }

  const records = (data as unknown as Record<string, unknown>[]).map((row, i) =>
    rowToRecord(row, i + 1),
  );
  return { records, source: "supabase" };
}

// Cache the (expensive) full-table Supabase read across navigations, so
// switching between Registry and Statistics doesn't re-paginate all rows every
// time. Invalidated immediately on Sync via revalidateTag("registry") in
// app/actions.ts; otherwise refreshed at most once per minute (so out-of-band
// DB edits still surface within ~60s).
// The full row set (~2 MB) exceeds Next's 2 MB data-cache limit, so we can't use
// unstable_cache here. Instead we memoize it in-process with a short TTL, which
// keeps repeated reads (e.g. a Registry re-render) from re-querying Supabase.
// Together with the client Router Cache (experimental.staleTimes), navigating
// back to the Registry no longer reloads the data. Cleared on Sync.
let registryMemo: { at: number; value: RegistrySource } | null = null;
const REGISTRY_TTL_MS = 60_000;

/** Load the full registry (every record), memoized in-process for ~60s. */
export async function getRegistry(): Promise<RegistrySource> {
  const now = Date.now();
  if (registryMemo && now - registryMemo.at < REGISTRY_TTL_MS) {
    return registryMemo.value;
  }
  const value = await loadRegistry();
  registryMemo = { at: now, value };
  return value;
}

/** Drop the in-process registry memo — called after a Sync writes new data. */
export function invalidateRegistryCache(): void {
  registryMemo = null;
}

export interface RegistryStatistics {
  source: RegistrySource["source"];
  data: StatsData;
}

/**
 * Pre-aggregated statistics for the charts. We compute the (small) aggregates
 * server-side and CACHE them — well under the 2 MB limit — so switching to
 * /statistics neither re-fetches the whole table nor ships ~2 MB of records to
 * the browser (that transfer was the switch lag). Invalidated on Sync via
 * revalidateTag("registry"); otherwise refreshed at most once per minute.
 */
const cachedStatistics = unstable_cache(
  async (): Promise<RegistryStatistics> => {
    const { records, source } = await loadRegistry();
    return { source, data: computeStatistics(records) };
  },
  ["registry-statistics"],
  { revalidate: 60, tags: ["registry"] },
);

export async function getStatistics(): Promise<RegistryStatistics> {
  return cachedStatistics();
}

export { KEY_TO_LETTER };
