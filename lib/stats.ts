import type { NttcRecord } from "./columns";
import { field, validityStatus, STATUS_META, type ValidityStatus } from "./nttc";

export interface Slice {
  label: string;
  value: number;
}

const UNSPECIFIED = "Unspecified";

/** Group records by a derived key, dropping blanks into "Unspecified", sorted desc. */
function tally(records: NttcRecord[], keyFn: (r: NttcRecord) => string): Slice[] {
  const map = new Map<string, number>();
  for (const r of records) {
    const key = keyFn(r).trim() || UNSPECIFIED;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

export const byProvince = (r: NttcRecord[]): Slice[] => tally(r, (x) => field(x, "B"));
export const bySector = (r: NttcRecord[]): Slice[] => tally(r, (x) => field(x, "Q"));
export const byQualification = (r: NttcRecord[]): Slice[] => tally(r, (x) => field(x, "R"));
/** Employment-type distribution in a fixed, meaningful order (blanks -> Unspecified). */
const EMPLOYMENT_ORDER = ["Private", "Public", "TESDA", UNSPECIFIED, "Other Government Agency"];
export function byEmploymentType(records: NttcRecord[]): Slice[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    const key = field(r, "AH").trim() || UNSPECIFIED;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  // Fixed order first; append any unexpected label so nothing is lost; drop zero-counts.
  const ordered = [...EMPLOYMENT_ORDER];
  for (const k of counts.keys()) if (!ordered.includes(k)) ordered.push(k);
  return ordered
    .map((label) => ({ label, value: counts.get(label) ?? 0 }))
    .filter((s) => s.value > 0);
}
export const byNttcType = (r: NttcRecord[]): Slice[] => tally(r, (x) => field(x, "AG"));
export const byInstitutionType = (r: NttcRecord[]): Slice[] => tally(r, (x) => field(x, "N"));

/** Validity status distribution, in a fixed, meaningful order. */
export function byValidity(records: NttcRecord[]): Slice[] {
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

/** Keep the n largest slices, rolling the long tail into one "Other" slice. */
export function topNWithOther(slices: Slice[], n: number): Slice[] {
  if (slices.length <= n) return slices;
  const top = slices.slice(0, n);
  const rest = slices.slice(n);
  const otherValue = rest.reduce((sum, s) => sum + s.value, 0);
  if (otherValue <= 0) return top;
  return [...top, { label: `Other (${rest.length})`, value: otherValue }];
}

// ── Pre-aggregated statistics (computed server-side, cached) ────────────────
// The Statistics page renders these directly instead of receiving every record,
// so the page payload stays tiny (a few KB) instead of ~2 MB of raw rows.
const STATS_TOP_N = 10;

export type StatusFilter = "all" | "valid" | "expiring" | "expired";

export interface StatBucket {
  recordCount: number;
  provinceCount: number;
  sectorCount: number;
  qualCount: number;
  province: Slice[];
  validity: Slice[];
  sector: Slice[]; // top-N + "Other" (for charts)
  employment: Slice[];
  institution: Slice[];
  nttcType: Slice[];
  qualification: Slice[]; // top-N + "Other" (for charts)
  sectorFull: Slice[]; // every sector, by count (for exports)
  qualificationFull: Slice[]; // every qualification, by count (for exports)
}

export type StatsData = Record<StatusFilter, StatBucket>;

function statBucket(records: NttcRecord[]): StatBucket {
  const provinceAll = byProvince(records);
  const sectorAll = bySector(records);
  const qualAll = byQualification(records);
  return {
    recordCount: records.length,
    provinceCount: provinceAll.length,
    sectorCount: sectorAll.length,
    qualCount: qualAll.length,
    province: provinceAll,
    validity: byValidity(records),
    sector: topNWithOther(sectorAll, STATS_TOP_N),
    employment: byEmploymentType(records),
    institution: byInstitutionType(records),
    nttcType: byNttcType(records),
    qualification: topNWithOther(qualAll, STATS_TOP_N),
    sectorFull: sectorAll,
    qualificationFull: qualAll,
  };
}

/** Aggregate the whole registry into per-status buckets for the charts. */
export function computeStatistics(records: NttcRecord[]): StatsData {
  const valid: NttcRecord[] = [];
  const expiring: NttcRecord[] = [];
  const expired: NttcRecord[] = [];
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
