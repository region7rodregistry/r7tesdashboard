// Unified, cross-registry view of a "school" (training institution) for the
// Overview module.
//
// A single institution can appear in TWO registries with slightly different
// spellings:
//   • UTPRAS            — one row per registered *program* (institution_name)
//   • PTCACs / Centers  — one row per accredited *qualification* (assessment_center)
//
// e.g. UTPRAS "3A Prime Hospitality Training and Assessment Center Inc." and
// PTCAC "3A PRIME HOSPITALITY TRAINING AND ASSESSMENT CENTER, INC." are the same
// school. To join them accurately we key on a PUNCTUATION- and case-insensitive
// form of the name (matchKey), which folds "Center Inc." ↔ "CENTER, INC.".
// Branches of a brand keep distinct names where the data distinguishes them.

import type { UtprasRecord } from "./utpras-columns";
import type { PtcacsRecord } from "./ptcacs-columns";

const f = (r: UtprasRecord | PtcacsRecord, k: string): string =>
  (r[k] as string | number | null | undefined)?.toString().trim() || "";

/**
 * Cross-registry join key. The two registries spell the same institution
 * differently, so we normalize before comparing:
 *   • strip diacritics (ñ→n) so accents never split a word or fail to match;
 *   • "&" → "and"  (very common: "Training & Assessment" vs "…and Assessment");
 *   • fold corporate suffix variants: incorporated→inc, corporation→corp;
 *   • "saint"→"st", "dev't"/"devt"→"development";
 *   • collapse every remaining run of non-alphanumerics to a single space.
 * These rules fold genuine same-institution variants together without merging
 * distinct schools (validated against the full snapshot).
 */
export const matchKey = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bincorporated\b/g, "inc")
    .replace(/\bcorporation\b/g, "corp")
    .replace(/\bsaint\b/g, "st")
    .replace(/\bdev t\b|\bdevt\b/g, "development")
    .replace(/\s+/g, " ")
    .trim();

const uniqSorted = (values: string[]): string[] =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));

/** Most frequent non-empty value, tie-broken by first-seen order. */
function mode(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best = "";
  let bestN = 0;
  for (const [v, n] of counts) {
    if (n > bestN) {
      best = v;
      bestN = n;
    }
  }
  return best;
}

export interface UnifiedSchool {
  /** Punctuation/case-insensitive institution key — stable for lists/selection. */
  key: string;
  /** Best display name (prefers the mixed-case UTPRAS spelling). */
  name: string;
  provinces: string[];
  municipalities: string[];
  sectors: string[];
  inUtpras: boolean;
  inPtcac: boolean;
  /** UTPRAS registered programs for this school. */
  programs: UtprasRecord[];
  /** PTCAC assessment-center accreditations for this school. */
  accreditations: PtcacsRecord[];
  // Representative identity/contact (UTPRAS preferred, PTCAC as fallback).
  head: string;
  address: string;
  tel_no: string;
  email: string;
  institution_type: string;
  classification: string;
}

/** Join the UTPRAS registry and the PTCAC assessment centers into one school list. */
export function buildUnifiedSchools(
  utpras: UtprasRecord[],
  centers: PtcacsRecord[],
): UnifiedSchool[] {
  const groups = new Map<string, { programs: UtprasRecord[]; accreditations: PtcacsRecord[] }>();
  const bucket = (key: string) => {
    let g = groups.get(key);
    if (!g) {
      g = { programs: [], accreditations: [] };
      groups.set(key, g);
    }
    return g;
  };

  for (const r of utpras) {
    const name = f(r, "institution_name");
    if (!name) continue;
    bucket(matchKey(name)).programs.push(r);
  }
  for (const r of centers) {
    const name = f(r, "assessment_center");
    if (!name) continue;
    bucket(matchKey(name)).accreditations.push(r);
  }

  const schools: UnifiedSchool[] = [];
  for (const [key, { programs, accreditations }] of groups) {
    // Prefer the UTPRAS (mixed-case) spelling; fall back to the PTCAC name.
    const name =
      mode(programs.map((p) => f(p, "institution_name"))) ||
      mode(accreditations.map((p) => f(p, "assessment_center")));

    schools.push({
      key,
      name,
      provinces: uniqSorted([
        ...programs.map((p) => f(p, "province")),
        ...accreditations.map((p) => f(p, "province")),
      ]),
      municipalities: uniqSorted(programs.map((p) => f(p, "municipality"))),
      sectors: uniqSorted([
        ...programs.map((p) => f(p, "sector")),
        ...accreditations.map((p) => f(p, "sector")),
      ]),
      inUtpras: programs.length > 0,
      inPtcac: accreditations.length > 0,
      programs,
      accreditations,
      head:
        mode(programs.map((p) => f(p, "institution_head"))) ||
        mode(accreditations.map((p) => f(p, "center_manager"))),
      address:
        mode(programs.map((p) => f(p, "address"))) ||
        mode(accreditations.map((p) => f(p, "address"))),
      tel_no:
        mode(programs.map((p) => f(p, "tel_no"))) ||
        mode(accreditations.map((p) => f(p, "tel_no"))),
      email: mode(programs.map((p) => f(p, "email"))),
      institution_type: mode(programs.map((p) => f(p, "institution_type"))),
      classification: mode(programs.map((p) => f(p, "classification"))),
    });
  }

  schools.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  return schools;
}

// The registry loaders return stable array references for ~60s (in-process
// memo), so cache the join keyed on those references — the Overview page is
// force-dynamic and would otherwise rebuild the union on every request.
let memo: { u: UtprasRecord[]; c: PtcacsRecord[]; out: UnifiedSchool[] } | null = null;

/** Memoized buildUnifiedSchools — recomputes only when either source changes. */
export function getUnifiedSchools(
  utpras: UtprasRecord[],
  centers: PtcacsRecord[],
): UnifiedSchool[] {
  if (memo && memo.u === utpras && memo.c === centers) return memo.out;
  const out = buildUnifiedSchools(utpras, centers);
  memo = { u: utpras, c: centers, out };
  return out;
}

/** True when a school operates in more than one province or municipality. */
export function isMultiSite(s: UnifiedSchool): boolean {
  return s.provinces.length > 1 || s.municipalities.length > 1;
}

/** Short, honest location label (handles multi-site brands). */
export function locationLabel(s: UnifiedSchool): string {
  if (s.provinces.length === 0) return "";
  if (s.provinces.length > 1) return `${s.provinces.length} provinces`;
  if (s.municipalities.length > 1) return `${s.municipalities.length} locations · ${s.provinces[0]}`;
  return [s.municipalities[0], s.provinces[0]].filter(Boolean).join(", ");
}

export interface UnifiedOverview {
  schools: number;
  inUtpras: number;
  inPtcac: number;
  inBoth: number;
  programs: number;
  accreditations: number;
}

export function computeUnifiedOverview(schools: UnifiedSchool[]): UnifiedOverview {
  let inUtpras = 0;
  let inPtcac = 0;
  let inBoth = 0;
  let programs = 0;
  let accreditations = 0;
  for (const s of schools) {
    if (s.inUtpras) inUtpras++;
    if (s.inPtcac) inPtcac++;
    if (s.inUtpras && s.inPtcac) inBoth++;
    programs += s.programs.length;
    accreditations += s.accreditations.length;
  }
  return { schools: schools.length, inUtpras, inPtcac, inBoth, programs, accreditations };
}
