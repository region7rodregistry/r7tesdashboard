// School-level view of the UTPRAS registry.
//
// The registry stores one row per *program* (a qualification an institution is
// registered to deliver). The Schools tab groups those rows by institution so
// each school — e.g. "3A Prime Hospitality Training and Assessment Center Inc."
// — becomes a single entry that owns all of its programs and its own KPIs.
//
// Grouping is by a NORMALIZED institution name (case- and whitespace-insensitive)
// because a handful of schools appear with minor spelling variants across rows;
// collapsing them keeps a school from splitting into duplicate cards. The
// displayed name is the most common raw spelling.
//
// A single institution name can span more than one registered branch (different
// municipality / Unique Institution ID), so the multi-valued identity fields —
// provinces, municipalities and uiids — are kept as DISTINCT SETS rather than a
// single "most common" value. That avoids presenting a Cebu branch's programs
// under, say, a Bohol address: the UI shows "2 provinces" / lists the IDs
// instead of silently picking one.

import type { UtprasRecord } from "./utpras-columns";
import { field, computeStats, type UtprasStats } from "./utpras";

export interface School {
  /** Case/whitespace-normalized institution name — stable key for lists & selection. */
  key: string;
  /** Most common raw spelling of the institution name (for display). */
  name: string;
  /** Distinct provinces this school operates in (sorted). */
  provinces: string[];
  /** Distinct municipalities this school operates in (sorted). */
  municipalities: string[];
  /** Distinct, real Unique Institution IDs (placeholders/blanks dropped, sorted). */
  uiids: string[];
  institution_type: string; // Public / Private (representative)
  classification: string; // TVI / TTI / HEI / … (representative)
  institution_head: string; // representative
  address: string; // representative (used only when the school is single-site)
  tel_no: string; // representative
  email: string; // representative
  /** Distinct sectors this school delivers programs in (sorted). */
  sectors: string[];
  /** Every registry row belonging to this school. */
  programs: UtprasRecord[];
  /** Validity stats computed over this school's programs. */
  stats: UtprasStats;
}

/** Case/whitespace-insensitive grouping key for an institution name. */
const normKey = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Treat blank values and the literal "Not Found" placeholder as absent. */
export const cleanUiid = (v: string): string =>
  !v || /^not\s*found$/i.test(v.trim()) ? "" : v.trim();

/** Distinct, non-empty, alphabetically sorted. */
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

/** Group registry rows into schools, sorted alphabetically by name. */
export function groupSchools(records: UtprasRecord[]): School[] {
  // 1. Bucket rows by normalized institution name.
  const byName = new Map<string, UtprasRecord[]>();
  for (const r of records) {
    const name = field(r, "institution_name");
    if (!name) continue; // skip rows with no institution
    const key = normKey(name);
    const arr = byName.get(key);
    if (arr) arr.push(r);
    else byName.set(key, [r]);
  }

  // 2. Union name-buckets that share a real Unique Institution ID. This folds a
  //    single registered institution that appears under more than one spelling
  //    (e.g. "University of the Visayas-Main" vs "…, Inc.", both 0722-0062) into
  //    one card. Branches of one brand keep distinct UIIDs, so this never merges
  //    unrelated schools, and "Not Found"/blank IDs are excluded as join keys.
  const parent = new Map<string, string>();
  for (const k of byName.keys()) parent.set(k, k);
  const find = (x: string): string => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root)!;
    while (parent.get(x) !== root) {
      const next = parent.get(x)!;
      parent.set(x, root);
      x = next;
    }
    return root;
  };
  const uiidToNames = new Map<string, string[]>();
  for (const [k, rows] of byName) {
    for (const r of rows) {
      const u = cleanUiid(field(r, "unique_institution_id"));
      if (!u) continue;
      const list = uiidToNames.get(u);
      if (list) {
        if (!list.includes(k)) list.push(k);
      } else uiidToNames.set(u, [k]);
    }
  }
  for (const names of uiidToNames.values()) {
    for (let i = 1; i < names.length; i++) {
      const ra = find(names[0]);
      const rb = find(names[i]);
      if (ra !== rb) parent.set(ra, rb);
    }
  }

  // 3. Merge buckets by their union root.
  const groups = new Map<string, UtprasRecord[]>();
  for (const [k, rows] of byName) {
    const root = find(k);
    const arr = groups.get(root);
    if (arr) arr.push(...rows);
    else groups.set(root, [...rows]);
  }

  const schools: School[] = [];
  for (const [key, programs] of groups) {
    const pick = (col: string) => mode(programs.map((p) => field(p, col)));

    schools.push({
      key,
      name: mode(programs.map((p) => field(p, "institution_name"))),
      provinces: uniqSorted(programs.map((p) => field(p, "province"))),
      municipalities: uniqSorted(programs.map((p) => field(p, "municipality"))),
      uiids: uniqSorted(programs.map((p) => cleanUiid(field(p, "unique_institution_id")))),
      institution_type: pick("institution_type"),
      classification: pick("classification"),
      institution_head: pick("institution_head"),
      address: pick("address"),
      tel_no: pick("tel_no"),
      email: pick("email"),
      sectors: uniqSorted(programs.map((p) => field(p, "sector"))),
      programs,
      stats: computeStats(programs),
    });
  }

  schools.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  return schools;
}

/** True when a school spans more than one site (province or municipality). */
export function isMultiSite(s: School): boolean {
  return s.provinces.length > 1 || s.municipalities.length > 1;
}

/** Short, honest location label for a school (handles multi-site brands). */
export function locationLabel(s: School): string {
  if (s.provinces.length === 0) return "";
  if (s.provinces.length > 1) return `${s.provinces.length} provinces`;
  if (s.municipalities.length > 1) return `${s.municipalities.length} locations · ${s.provinces[0]}`;
  return [s.municipalities[0], s.provinces[0]].filter(Boolean).join(", ");
}

export interface SchoolsOverview {
  schools: number;
  programs: number;
  publicSchools: number;
  privateSchools: number;
}

/** Headline counts for the Schools directory. */
export function computeSchoolsOverview(schools: School[]): SchoolsOverview {
  let publicSchools = 0;
  let privateSchools = 0;
  let programs = 0;
  for (const s of schools) {
    programs += s.programs.length;
    if (/public/i.test(s.institution_type)) publicSchools++;
    else if (/private/i.test(s.institution_type)) privateSchools++;
  }
  return {
    schools: schools.length,
    programs,
    publicSchools,
    privateSchools,
  };
}
