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
 * snapshot if a Supabase query errors.
 */
export async function getRegistry(): Promise<RegistrySource> {
  const supabase = getSupabaseReadClient();
  if (!supabase) {
    return { records: localTyped, source: "local" };
  }

  const selectCols = ["id", ...COLUMNS.map((c) => c.key)].join(", ");
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(selectCols)
    .order("id", { ascending: true });

  if (error || !data) {
    console.error("[data] Supabase read failed, using local snapshot:", error?.message);
    return { records: localTyped, source: "local" };
  }

  const records = (data as unknown as Record<string, unknown>[]).map((row, i) =>
    rowToRecord(row, i + 1),
  );
  return { records, source: "supabase" };
}

export { KEY_TO_LETTER };
