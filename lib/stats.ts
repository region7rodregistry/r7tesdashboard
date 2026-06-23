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
export const byEmploymentType = (r: NttcRecord[]): Slice[] => tally(r, (x) => field(x, "AH"));
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
