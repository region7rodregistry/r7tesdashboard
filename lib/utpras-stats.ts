// Pre-aggregated statistics for the UTPRAS Statistics page.
//
// Mirrors lib/stats.ts (NTTC): the page renders these small per-status buckets
// instead of receiving every record, so the payload stays a few KB rather than
// the full registry. Validity keys off the program `expiration_date`.

import type { UtprasRecord } from "./utpras-columns";
import { field, validityStatus } from "./utpras";
import { STATUS_META, type ValidityStatus } from "./nttc";
import { topNWithOther, type Slice } from "./stats";

const UNSPECIFIED = "Unspecified";
const STATS_TOP_N = 10;

/** Group records by a derived key, dropping blanks into "Unspecified", sorted desc. */
function tally(records: UtprasRecord[], keyFn: (r: UtprasRecord) => string): Slice[] {
  const map = new Map<string, number>();
  for (const r of records) {
    const key = keyFn(r).trim() || UNSPECIFIED;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

const byProvince = (r: UtprasRecord[]): Slice[] => tally(r, (x) => field(x, "province"));
const bySector = (r: UtprasRecord[]): Slice[] => tally(r, (x) => field(x, "sector"));
const byQualification = (r: UtprasRecord[]): Slice[] => tally(r, (x) => field(x, "course_program"));
const byInstitutionType = (r: UtprasRecord[]): Slice[] => tally(r, (x) => field(x, "institution_type"));
const byClassification = (r: UtprasRecord[]): Slice[] => tally(r, (x) => field(x, "classification"));
const byPqfLevel = (r: UtprasRecord[]): Slice[] => tally(r, (x) => field(x, "pqf_level"));

/** Validity status distribution, in a fixed, meaningful order. */
function byValidity(records: UtprasRecord[]): Slice[] {
  const order: ValidityStatus[] = ["valid", "expiring", "expired", "unknown"];
  const counts = new Map<ValidityStatus, number>();
  for (const r of records) {
    const s = validityStatus(r);
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return order
    .map((s) => ({ label: STATUS_META[s].label, value: counts.get(s) ?? 0 }))
    .filter((s) => s.value > 0);
}

export type UtprasStatusFilter = "all" | "valid" | "expiring" | "expired";

export interface UtprasStatBucket {
  recordCount: number;
  provinceCount: number;
  sectorCount: number;
  institutionCount: number;
  qualCount: number;
  province: Slice[];
  validity: Slice[];
  sector: Slice[]; // top-N + "Other" (for charts)
  institutionType: Slice[];
  classification: Slice[];
  pqfLevel: Slice[];
  qualification: Slice[]; // top-N + "Other" (for charts)
  sectorFull: Slice[]; // every sector, by count (for exports)
  qualificationFull: Slice[]; // every qualification, by count (for exports)
}

export type UtprasStatsData = Record<UtprasStatusFilter, UtprasStatBucket>;

function statBucket(records: UtprasRecord[]): UtprasStatBucket {
  const provinceAll = byProvince(records);
  const sectorAll = bySector(records);
  const qualAll = byQualification(records);
  const institutions = new Set<string>();
  for (const r of records) {
    const v = field(r, "institution_name");
    if (v) institutions.add(v);
  }
  return {
    recordCount: records.length,
    provinceCount: provinceAll.length,
    sectorCount: sectorAll.length,
    institutionCount: institutions.size,
    qualCount: qualAll.length,
    province: provinceAll,
    validity: byValidity(records),
    sector: topNWithOther(sectorAll, STATS_TOP_N),
    institutionType: byInstitutionType(records),
    classification: byClassification(records),
    pqfLevel: byPqfLevel(records),
    qualification: topNWithOther(qualAll, STATS_TOP_N),
    sectorFull: sectorAll,
    qualificationFull: qualAll,
  };
}

/** Aggregate the whole UTPRAS registry into per-status buckets for the charts. */
export function computeUtprasStatistics(records: UtprasRecord[]): UtprasStatsData {
  const valid: UtprasRecord[] = [];
  const expiring: UtprasRecord[] = [];
  const expired: UtprasRecord[] = [];
  for (const r of records) {
    const s = validityStatus(r);
    if (s === "valid") valid.push(r);
    else if (s === "expiring") expiring.push(r);
    else if (s === "expired") expired.push(r);
  }
  return {
    all: statBucket(records),
    valid: statBucket(valid),
    expiring: statBucket(expiring),
    expired: statBucket(expired),
  };
}
