// School-level view of the UTPRAS registry.
//
// The registry stores one row per *program* (a qualification an institution is
// registered to deliver). The Schools tab groups those rows by institution so
// each school — e.g. "3A Prime Hospitality Training and Assessment Center Inc."
// — becomes a single entry that owns all of its programs and its own KPIs.
//
// Grouping is by a NORMALIZED institution name (case- and whitespace-insensitive)
// because a handful of schools appear with minor spelling variants across rows
// (e.g. "ExcelUp" vs "Excelup"); collapsing them keeps a school from splitting
// into duplicate cards. The displayed name is the most common raw spelling.

import type { UtprasRecord } from "./utpras-columns";
import { field, computeStats, type UtprasStats } from "./utpras";

export interface School {
  /** Normalized institution name — stable key for React lists & selection. */
  key: string;
  /** Most common raw spelling of the institution name (for display). */
  name: string;
  province: string;
  municipality: string;
  region: string;
  congressional_district: string;
  institution_type: string; // Public / Private
  classification: string; // TVI / TTI / HEI / …
  institution_head: string;
  address: string;
  tel_no: string;
  email: string;
  unique_institution_id: string;
  /** Distinct sectors this school delivers programs in (sorted). */
  sectors: string[];
  /** Every registry row belonging to this school. */
  programs: UtprasRecord[];
  /** Validity stats computed over this school's programs. */
  stats: UtprasStats;
}

/** Case/whitespace-insensitive grouping key for an institution name. */
const normKey = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

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
  const groups = new Map<string, UtprasRecord[]>();
  for (const r of records) {
    const name = field(r, "institution_name");
    if (!name) continue; // skip rows with no institution
    const key = normKey(name);
    const arr = groups.get(key);
    if (arr) arr.push(r);
    else groups.set(key, [r]);
  }

  const schools: School[] = [];
  for (const [key, programs] of groups) {
    const pick = (col: string) => mode(programs.map((p) => field(p, col)));
    const sectors = Array.from(
      new Set(programs.map((p) => field(p, "sector")).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));

    schools.push({
      key,
      name: mode(programs.map((p) => field(p, "institution_name"))),
      province: pick("province"),
      municipality: pick("municipality"),
      region: pick("region"),
      congressional_district: pick("congressional_district"),
      institution_type: pick("institution_type"),
      classification: pick("classification"),
      institution_head: pick("institution_head"),
      address: pick("address"),
      tel_no: pick("tel_no"),
      email: pick("email"),
      unique_institution_id: pick("unique_institution_id"),
      sectors,
      programs,
      stats: computeStats(programs),
    });
  }

  schools.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  return schools;
}

export interface SchoolsOverview {
  schools: number;
  programs: number;
  publicSchools: number;
  privateSchools: number;
  provinces: number;
}

/** Headline counts for the Schools directory. */
export function computeSchoolsOverview(schools: School[]): SchoolsOverview {
  let publicSchools = 0;
  let privateSchools = 0;
  let programs = 0;
  const provinces = new Set<string>();
  for (const s of schools) {
    programs += s.programs.length;
    if (/public/i.test(s.institution_type)) publicSchools++;
    else if (/private/i.test(s.institution_type)) privateSchools++;
    if (s.province) provinces.add(s.province);
  }
  return {
    schools: schools.length,
    programs,
    publicSchools,
    privateSchools,
    provinces: provinces.size,
  };
}
