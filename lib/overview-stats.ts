import "server-only";

// Cross-registry aggregates for the Overview page's "Regional snapshot" charts.
//
// Unlike the per-module Statistics pages, these slices are deliberately
// cross-cutting: certification health for the NTTC workforce, accreditation
// health for the PTCAC network, and where both are concentrated geographically
// and by sector. Everything is pre-aggregated server-side so the page payload
// stays a few KB (never the raw registries).

import type { NttcRecord } from "./columns";
import type { PtcacsRecord } from "./ptcacs-columns";
import { byProvince, bySector, byValidity, topNWithOther, type Slice } from "./stats";
import { field as centerField, validityStatus as centerValidityStatus } from "./ptcacs";
import { STATUS_META, type ValidityStatus } from "./nttc";

const STATUS_ORDER: ValidityStatus[] = ["valid", "expiring", "expired", "unknown"];
const TOP_SECTORS = 8;

export interface OverviewCharts {
  /** NTTC certification status (Valid / Expiring / Expired / No date). */
  nttcValidity: Slice[];
  /** PTCAC accreditation status, by accreditation row. */
  centerValidity: Slice[];
  /** Certified NTTC trainers per province. */
  trainersByProvince: Slice[];
  /** Distinct accredited assessment centers per province. */
  centersByProvince: Slice[];
  /** Region-wide trainer supply by TVET sector (top N + Other). */
  topSectors: Slice[];
  /** Distinct NTTC sector count (for the sector chart caption). */
  sectorCount: number;
}

/** Accreditation-status distribution for the assessment-center registry. */
function centerValiditySlices(centers: PtcacsRecord[]): Slice[] {
  const counts = new Map<ValidityStatus, number>();
  for (const r of centers) {
    const s = centerValidityStatus(r);
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return STATUS_ORDER.map((s) => ({ label: STATUS_META[s].label, value: counts.get(s) ?? 0 })).filter(
    (s) => s.value > 0,
  );
}

/** Distinct assessment centers (not accreditation rows) per province, desc. */
function centersByProvinceSlices(centers: PtcacsRecord[]): Slice[] {
  const byProv = new Map<string, Set<string>>();
  for (const r of centers) {
    const province = centerField(r, "province") || "Unspecified";
    const name = centerField(r, "assessment_center");
    if (!name) continue;
    let set = byProv.get(province);
    if (!set) {
      set = new Set();
      byProv.set(province, set);
    }
    set.add(name);
  }
  return [...byProv.entries()]
    .map(([label, set]) => ({ label, value: set.size }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

/** Build every Overview chart slice from the three live registries. */
export function computeOverviewCharts(nttc: NttcRecord[], centers: PtcacsRecord[]): OverviewCharts {
  const sectorsAll = bySector(nttc);
  return {
    nttcValidity: byValidity(nttc),
    centerValidity: centerValiditySlices(centers),
    trainersByProvince: byProvince(nttc),
    centersByProvince: centersByProvinceSlices(centers),
    topSectors: topNWithOther(sectorsAll, TOP_SECTORS),
    sectorCount: sectorsAll.length,
  };
}
