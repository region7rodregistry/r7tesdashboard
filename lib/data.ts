import "server-only";
import localRecords from "@/data/records.json";
import { COLUMNS, KEY_TO_LETTER, TABLE_NAME, type NttcRecord } from "./columns";
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
    rec[col.letter] = v === null || v === undefined ? null : String(v);
  }
  return rec;
}

const localTyped = localRecords as unknown as NttcRecord[];

/**
 * Load the registry. Prefers Supabase when configured; otherwise serves the
 * bundled snapshot so the dashboard works out of the box. Falls back to the
 * snapshot if a Supabase query errors OR returns zero rows (table not created /
 * not seeded / RLS blocking reads) — so the dashboard is never blank.
 */
export async function getRegistry(): Promise<RegistrySource> {
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

export { KEY_TO_LETTER };
