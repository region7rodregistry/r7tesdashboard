import type { PtcacsRecord } from "./ptcacs-columns";
import {
  parseDate,
  formatDate,
  STATUS_META,
  type ValidityStatus,
} from "./nttc";

// Date parsing/formatting and the validity-status vocabulary are generic, so we
// reuse them from lib/nttc. Everything below is shared by both PTCACs
// registries (assessment centers + assessors); validity keys off `valid_until`.
export { parseDate, formatDate, STATUS_META };
export type { ValidityStatus };

// ── Field accessor (by snake_case column key) ───────────────────────────────
export const field = (r: PtcacsRecord, key: string): string =>
  (r[key] as string | number | null | undefined)?.toString().trim() || "";

// ── Validity status (based on the accreditation's VALID UNTIL date) ──────────
const DAY = 24 * 60 * 60 * 1000;

export function validityStatus(
  r: PtcacsRecord,
  now: Date = new Date(),
): ValidityStatus {
  const exp = parseDate(field(r, "valid_until"));
  if (!exp) return "unknown";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = (exp.getTime() - today.getTime()) / DAY;
  if (diffDays < 0) return "expired";
  if (diffDays <= 90) return "expiring";
  return "valid";
}

export function daysUntilExpiry(
  r: PtcacsRecord,
  now: Date = new Date(),
): number | null {
  const exp = parseDate(field(r, "valid_until"));
  if (!exp) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((exp.getTime() - today.getTime()) / DAY);
}

// ── Derived collections ──────────────────────────────────────────────────────
export function uniqueSorted(records: PtcacsRecord[], key: string): string[] {
  const set = new Set<string>();
  for (const r of records) {
    const v = field(r, key);
    if (v) set.add(v);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export interface PtcacsStats {
  total: number;
  valid: number;
  expiring: number;
  expired: number;
  provinces: number;
  sectors: number;
  /** Distinct entities — assessment centers OR assessor names, by `entityKey`. */
  entities: number;
}

/**
 * Compute the headline counts for a registry. `entityKey` is the column that
 * identifies a unique entity ("assessment_center" for centers, "name" for
 * assessors) so the entity tally is meaningful for each registry.
 */
export function computeStats(
  records: PtcacsRecord[],
  entityKey: string,
  now: Date = new Date(),
): PtcacsStats {
  let valid = 0,
    expiring = 0,
    expired = 0;
  for (const r of records) {
    const s = validityStatus(r, now);
    if (s === "valid") valid++;
    else if (s === "expiring") expiring++;
    else if (s === "expired") expired++;
  }
  return {
    total: records.length,
    valid,
    expiring,
    expired,
    provinces: uniqueSorted(records, "province").length,
    sectors: uniqueSorted(records, "sector").length,
    entities: uniqueSorted(records, entityKey).length,
  };
}
