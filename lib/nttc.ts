import type { NttcRecord } from "./columns";

// ── Field accessors (by spreadsheet letter) ────────────────────────────────
export const field = (r: NttcRecord, letter: string): string =>
  (r[letter] as string | null | undefined)?.toString().trim() || "";

export function fullName(r: NttcRecord): string {
  const parts = [field(r, "D"), field(r, "E"), field(r, "C"), field(r, "F")]
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.join(" ");
}

export function lastFirst(r: NttcRecord): string {
  const last = field(r, "C");
  const first = [field(r, "D"), field(r, "E")].filter(Boolean).join(" ");
  const ext = field(r, "F");
  return `${last}, ${first}${ext ? " " + ext : ""}`.trim();
}

// ── Date parsing (handles "MM/DD/YYYY" and "Month D, YYYY") ─────────────────
const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const s = value.toString().trim();
  if (!s) return null;

  // MM/DD/YYYY (or M/D/YYYY)
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const [, mm, dd, yyyyRaw] = slash;
    const yyyy = yyyyRaw.length === 2 ? 2000 + Number(yyyyRaw) : Number(yyyyRaw);
    const d = new Date(yyyy, Number(mm) - 1, Number(dd));
    return isNaN(d.getTime()) ? null : d;
  }

  // "Month D, YYYY"
  const words = s.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (words) {
    const m = MONTHS[words[1].toLowerCase()];
    if (m !== undefined) {
      const d = new Date(Number(words[3]), m, Number(words[2]));
      return isNaN(d.getTime()) ? null : d;
    }
  }

  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function formatDate(value: string | null | undefined): string {
  const d = parseDate(value);
  if (!d) return value?.toString().trim() || "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ── Validity status (based on NTTC expiration date, column AD) ──────────────
export type ValidityStatus = "valid" | "expiring" | "expired" | "unknown";

export const STATUS_META: Record<
  ValidityStatus,
  { label: string; tone: string }
> = {
  valid: { label: "Valid", tone: "valid" },
  expiring: { label: "Expiring Soon", tone: "expiring" },
  expired: { label: "Expired", tone: "expired" },
  unknown: { label: "No Date", tone: "muted" },
};

const DAY = 24 * 60 * 60 * 1000;

export function validityStatus(
  r: NttcRecord,
  now: Date = new Date(),
): ValidityStatus {
  const exp = parseDate(field(r, "AD"));
  if (!exp) return "unknown";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = (exp.getTime() - today.getTime()) / DAY;
  if (diffDays < 0) return "expired";
  if (diffDays <= 90) return "expiring";
  return "valid";
}

export function daysUntilExpiry(r: NttcRecord, now: Date = new Date()): number | null {
  const exp = parseDate(field(r, "AD"));
  if (!exp) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((exp.getTime() - today.getTime()) / DAY);
}

// ── Derived collections ─────────────────────────────────────────────────────
export function uniqueSorted(records: NttcRecord[], letter: string): string[] {
  const set = new Set<string>();
  for (const r of records) {
    const v = field(r, letter);
    if (v) set.add(v);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export interface RegistryStats {
  total: number;
  valid: number;
  expiring: number;
  expired: number;
  provinces: number;
  qualifications: number;
}

export function computeStats(records: NttcRecord[], now: Date = new Date()): RegistryStats {
  let valid = 0, expiring = 0, expired = 0;
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
    provinces: uniqueSorted(records, "B").length,
    qualifications: uniqueSorted(records, "R").length,
  };
}
