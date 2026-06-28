import type { UtprasRecord } from "./utpras-columns";
import {
  parseDate,
  formatDate,
  STATUS_META,
  type ValidityStatus,
} from "./nttc";

// Date parsing/formatting and the validity-status vocabulary are generic, so we
// reuse them from lib/nttc. Everything below is UTPRAS-specific.
export { parseDate, formatDate, STATUS_META };
export type { ValidityStatus };

// ── Field accessor (by snake_case column key) ───────────────────────────────
export const field = (r: UtprasRecord, key: string): string =>
  (r[key] as string | number | null | undefined)?.toString().trim() || "";

// ── Validity status (based on the program EXPIRATION DATE) ───────────────────
const DAY = 24 * 60 * 60 * 1000;

export function validityStatus(
  r: UtprasRecord,
  now: Date = new Date(),
): ValidityStatus {
  const exp = parseDate(field(r, "expiration_date"));
  if (!exp) return "unknown";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = (exp.getTime() - today.getTime()) / DAY;
  if (diffDays < 0) return "expired";
  if (diffDays <= 90) return "expiring";
  return "valid";
}

export function daysUntilExpiry(
  r: UtprasRecord,
  now: Date = new Date(),
): number | null {
  const exp = parseDate(field(r, "expiration_date"));
  if (!exp) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((exp.getTime() - today.getTime()) / DAY);
}

// ── Derived collections ──────────────────────────────────────────────────────
export function uniqueSorted(records: UtprasRecord[], key: string): string[] {
  const set = new Set<string>();
  for (const r of records) {
    const v = field(r, key);
    if (v) set.add(v);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export interface UtprasStats {
  total: number;
  valid: number;
  expiring: number;
  expired: number;
  provinces: number;
  institutions: number;
  sectors: number;
}

export function computeStats(
  records: UtprasRecord[],
  now: Date = new Date(),
): UtprasStats {
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
    institutions: uniqueSorted(records, "institution_name").length,
    sectors: uniqueSorted(records, "sector").length,
  };
}
