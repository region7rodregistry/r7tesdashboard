// Pre-aggregated statistics for the PTCACs Statistics page.
//
// Mirrors lib/stats.ts (NTTC). PTCACs has TWO registries — Assessment Centers
// and Competency Assessors — so the page aggregates both and lets the user
// toggle between them. Validity keys off the accreditation `valid_until` date.
// Assessor-only breakdowns (sex, educational attainment) are included only for
// the assessors dataset.

import type { PtcacsRecord } from "./ptcacs-columns";
import { field, validityStatus } from "./ptcacs";
import { STATUS_META, type ValidityStatus } from "./nttc";
import { topNWithOther, type Slice } from "./stats";

const UNSPECIFIED = "Unspecified";
const STATS_TOP_N = 10;

export type PtcacsKind = "centers" | "assessors";
export type PtcacsStatusFilter = "all" | "valid" | "expiring" | "expired";

/** Group records by a derived key, dropping blanks into "Unspecified", sorted desc. */
function tally(records: PtcacsRecord[], keyFn: (r: PtcacsRecord) => string): Slice[] {
  const map = new Map<string, number>();
  for (const r of records) {
    const key = keyFn(r).trim() || UNSPECIFIED;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

const byProvince = (r: PtcacsRecord[]): Slice[] => tally(r, (x) => field(x, "province"));
const bySector = (r: PtcacsRecord[]): Slice[] => tally(r, (x) => field(x, "sector"));
const byQualification = (r: PtcacsRecord[]): Slice[] => tally(r, (x) => field(x, "qualification_title"));
const bySex = (r: PtcacsRecord[]): Slice[] => tally(r, (x) => field(x, "sex"));
const byEducation = (r: PtcacsRecord[]): Slice[] => tally(r, (x) => field(x, "educational_attainment"));

/** Validity status distribution, in a fixed, meaningful order. */
function byValidity(records: PtcacsRecord[]): Slice[] {
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

export interface PtcacsStatBucket {
  recordCount: number; // accreditation rows
  entityCount: number; // distinct centers (or assessors)
  provinceCount: number;
  sectorCount: number;
  qualCount: number;
  province: Slice[];
  validity: Slice[];
  sector: Slice[]; // top-N + "Other" (for charts)
  qualification: Slice[]; // top-N + "Other" (for charts)
  sex?: Slice[]; // assessors only
  education?: Slice[]; // assessors only
  sectorFull: Slice[]; // every sector, by count (for exports)
  qualificationFull: Slice[]; // every qualification, by count (for exports)
}

export type PtcacsStatsData = Record<PtcacsStatusFilter, PtcacsStatBucket>;

function statBucket(
  records: PtcacsRecord[],
  kind: PtcacsKind,
  entityKey: string,
): PtcacsStatBucket {
  const provinceAll = byProvince(records);
  const sectorAll = bySector(records);
  const qualAll = byQualification(records);
  const entities = new Set<string>();
  for (const r of records) {
    const v = field(r, entityKey);
    if (v) entities.add(v);
  }
  const bucket: PtcacsStatBucket = {
    recordCount: records.length,
    entityCount: entities.size,
    provinceCount: provinceAll.length,
    sectorCount: sectorAll.length,
    qualCount: qualAll.length,
    province: provinceAll,
    validity: byValidity(records),
    sector: topNWithOther(sectorAll, STATS_TOP_N),
    qualification: topNWithOther(qualAll, STATS_TOP_N),
    sectorFull: sectorAll,
    qualificationFull: qualAll,
  };
  if (kind === "assessors") {
    bucket.sex = bySex(records);
    bucket.education = byEducation(records);
  }
  return bucket;
}

/**
 * Aggregate a PTCACs registry into per-status buckets for the charts.
 * `entityKey` identifies a unique entity ("assessment_center" for centers,
 * "name" for assessors) so the entity tally is meaningful per registry.
 */
export function computePtcacsStatistics(
  records: PtcacsRecord[],
  kind: PtcacsKind,
  entityKey: string,
): PtcacsStatsData {
  const valid: PtcacsRecord[] = [];
  const expiring: PtcacsRecord[] = [];
  const expired: PtcacsRecord[] = [];
  for (const r of records) {
    const s = validityStatus(r);
    if (s === "valid") valid.push(r);
    else if (s === "expiring") expiring.push(r);
    else if (s === "expired") expired.push(r);
  }
  return {
    all: statBucket(records, kind, entityKey),
    valid: statBucket(valid, kind, entityKey),
    expiring: statBucket(expiring, kind, entityKey),
    expired: statBucket(expired, kind, entityKey),
  };
}
