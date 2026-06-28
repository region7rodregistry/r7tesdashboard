import "server-only";
import localCenters from "@/data/assessment-centers.json";
import localAssessors from "@/data/assessors.json";
import {
  CENTER_COLUMNS,
  ASSESSOR_COLUMNS,
  CENTERS_TABLE_NAME,
  ASSESSORS_TABLE_NAME,
  type PtcacsColumnDef,
  type PtcacsRecord,
} from "./ptcacs-columns";
import { computePtcacsStatistics, type PtcacsStatsData } from "./ptcacs-stats";
import { getSupabaseReadClient } from "./supabase";

export interface PtcacsSource {
  records: PtcacsRecord[];
  source: "supabase" | "local";
}

const localCentersTyped = localCenters as unknown as PtcacsRecord[];
const localAssessorsTyped = localAssessors as unknown as PtcacsRecord[];

/** Translate a Supabase row (snake_case keys) into a PtcacsRecord. */
function rowToRecord(
  row: Record<string, unknown>,
  columns: PtcacsColumnDef[],
  fallbackId: number,
): PtcacsRecord {
  const rec: PtcacsRecord = {
    id: Number(row.id ?? fallbackId),
    source_sheet: row.source_sheet == null ? null : String(row.source_sheet),
  };
  for (const col of columns) {
    const v = row[col.key];
    rec[col.key] = v === null || v === undefined ? null : String(v);
  }
  return rec;
}

/**
 * Generic registry loader. Prefers Supabase when configured; otherwise serves
 * the bundled snapshot so the tab works out of the box. Falls back to the
 * snapshot if a Supabase query errors OR returns zero rows (table not created /
 * not seeded / RLS blocking reads) — so the page is never blank.
 */
async function loadRegistry(
  table: string,
  columns: PtcacsColumnDef[],
  snapshot: PtcacsRecord[],
): Promise<PtcacsSource> {
  const supabase = getSupabaseReadClient();
  if (!supabase) return { records: snapshot, source: "local" };

  const selectCols = ["id", "source_sheet", ...columns.map((c) => c.key)].join(", ");

  // PostgREST caps each response at ~1000 rows, so a single .select() silently
  // truncates large tables. Page through with .range() until a short page tells
  // us we've reached the end, then concatenate.
  const PAGE = 1000;
  const data: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabase
      .from(table)
      .select(selectCols)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      console.error(
        `[ptcacs] Supabase read of '${table}' failed (${error.message}). ` +
          `Run db/ptcacs_schema.sql + the matching seed. Serving local snapshot.`,
      );
      return { records: snapshot, source: "local" };
    }

    const rows = (page ?? []) as unknown as Record<string, unknown>[];
    data.push(...rows);
    if (rows.length < PAGE) break;
  }

  if (data.length === 0) {
    console.warn(
      `[ptcacs] Supabase '${table}' returned 0 rows — table is empty, not ` +
        `created, or RLS is blocking anon reads. Run db/ptcacs_schema.sql + the ` +
        `matching seed (and allow anon SELECT). Serving local snapshot.`,
    );
    return { records: snapshot, source: "local" };
  }

  const records = data.map((row, i) => rowToRecord(row, columns, i + 1));
  return { records, source: "supabase" };
}

// Memoize each registry in-process with a short TTL so repeated reads don't
// re-query Supabase on every render (mirrors lib/utpras-data.ts).
const TTL_MS = 60_000;
type Memo = { at: number; value: PtcacsSource } | null;
let centersMemo: Memo = null;
let assessorsMemo: Memo = null;

/** Load the full Assessment Centers registry, memoized in-process for ~60s. */
export async function getAssessmentCenters(): Promise<PtcacsSource> {
  const now = Date.now();
  if (centersMemo && now - centersMemo.at < TTL_MS) return centersMemo.value;
  const value = await loadRegistry(CENTERS_TABLE_NAME, CENTER_COLUMNS, localCentersTyped);
  centersMemo = { at: now, value };
  return value;
}

/** Load the full Competency Assessors registry, memoized in-process for ~60s. */
export async function getAssessors(): Promise<PtcacsSource> {
  const now = Date.now();
  if (assessorsMemo && now - assessorsMemo.at < TTL_MS) return assessorsMemo.value;
  const value = await loadRegistry(ASSESSORS_TABLE_NAME, ASSESSOR_COLUMNS, localAssessorsTyped);
  assessorsMemo = { at: now, value };
  return value;
}

/** Drop both in-process PTCACs memos. */
export function invalidatePtcacsCache(): void {
  centersMemo = null;
  assessorsMemo = null;
}

export interface PtcacsStatistics {
  source: PtcacsSource["source"];
  centers: PtcacsStatsData;
  assessors: PtcacsStatsData;
}

/**
 * Pre-aggregated statistics for BOTH PTCACs registries, computed from the
 * memoized reads. The Statistics page ships only the small aggregates and lets
 * the user toggle between Assessment Centers and Assessors. The source is
 * "supabase" when either registry came from Supabase.
 */
export async function getPtcacsStatistics(): Promise<PtcacsStatistics> {
  const [centers, assessors] = await Promise.all([
    getAssessmentCenters(),
    getAssessors(),
  ]);
  const source =
    centers.source === "supabase" || assessors.source === "supabase"
      ? "supabase"
      : "local";
  return {
    source,
    centers: computePtcacsStatistics(centers.records, "centers", "assessment_center"),
    assessors: computePtcacsStatistics(assessors.records, "assessors", "name"),
  };
}
