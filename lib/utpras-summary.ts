import "server-only";

// Live reproduction of the Compendium "Summary" sheet, computed from the UTPRAS
// registry instead of the workbook's COUNTIFS formulas.
//
//  • Registered Programs by type × province — the formula-driven part of the
//    sheet. Our `status` column holds the exact registration type the sheet
//    counts (WTR / RTP / WTR-MTP / CoC / WTR-MCC / RTP-MCC), so these match the
//    Compendium to the unit.
//  • TVET Providers by classification × province — distinct institutions in the
//    registry. The sheet tallies these from separate per-province UIID master
//    lists (no formulas), so live counts can differ by a few where the registry
//    spells one institution two ways. Totals sum the per-classification cells,
//    mirroring the sheet (an institution active in two classifications counts in
//    each).

import type { UtprasRecord } from "./utpras-columns";
import { field } from "./utpras";

// Sheet row order.
const PROVINCE_ORDER = ["Bohol", "Cebu", "Negros Oriental", "Siquijor"];

// Program registration types — `key` is the `status` value, `label` matches the
// sheet's column header (note: status "WTR-MTP" is shown as "MTP").
const PROGRAM_TYPES = [
  { key: "WTR", label: "WTR" },
  { key: "RTP", label: "RTP" },
  { key: "WTR-MTP", label: "MTP" },
  { key: "CoC", label: "CoC" },
  { key: "WTR-MCC", label: "WTR-MCC" },
  { key: "RTP-MCC", label: "RTP-MCC" },
];

// Provider classifications, grouped Private / Public as on the sheet.
const PROVIDER_TYPES: { key: string; label: string; group: "Private" | "Public" }[] = [
  { key: "TVI", label: "TVIs", group: "Private" },
  { key: "Farm School", label: "Farm School", group: "Private" },
  { key: "HEI", label: "HEIs", group: "Private" },
  { key: "Enterprise", label: "Enterprise (MCC)", group: "Private" },
  { key: "LGU", label: "LGU", group: "Public" },
  { key: "LUC", label: "LUC", group: "Public" },
  { key: "SUC", label: "SUC", group: "Public" },
  { key: "TTI", label: "TTI", group: "Public" },
];

export interface SummaryColumn {
  key: string;
  label: string;
  group?: "Private" | "Public";
}

export interface SummaryRow {
  province: string;
  cells: number[];
  total: number;
}

export interface SummaryMatrix {
  columns: SummaryColumn[];
  rows: SummaryRow[];
  columnTotals: number[];
  grandTotal: number;
}

export interface UtprasSummary {
  provinces: string[];
  asOf: string;
  programs: SummaryMatrix;
  providers: SummaryMatrix;
  totalPrograms: number;
  totalProviders: number;
}

function orderedProvinces(records: UtprasRecord[]): string[] {
  const present = new Set<string>();
  for (const r of records) {
    const p = field(r, "province");
    if (p) present.add(p);
  }
  const known = PROVINCE_ORDER.filter((p) => present.has(p));
  const extra = [...present].filter((p) => !PROVINCE_ORDER.includes(p)).sort((a, b) => a.localeCompare(b));
  return [...known, ...extra];
}

function finalize(columns: SummaryColumn[], rows: SummaryRow[]): SummaryMatrix {
  const columnTotals = columns.map((_, i) => rows.reduce((sum, r) => sum + r.cells[i], 0));
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);
  return { columns, rows, columnTotals, grandTotal };
}

function programsMatrix(records: UtprasRecord[], provinces: string[]): SummaryMatrix {
  const columns: SummaryColumn[] = PROGRAM_TYPES.map((t) => ({ key: t.key, label: t.label }));
  const rows: SummaryRow[] = provinces.map((province) => {
    const sub = records.filter((r) => field(r, "province") === province);
    const cells = PROGRAM_TYPES.map((t) => sub.filter((r) => field(r, "status") === t.key).length);
    return { province, cells, total: cells.reduce((a, b) => a + b, 0) };
  });
  return finalize(columns, rows);
}

function providersMatrix(records: UtprasRecord[], provinces: string[]): SummaryMatrix {
  const columns: SummaryColumn[] = PROVIDER_TYPES.map((t) => ({ key: t.key, label: t.label, group: t.group }));
  const rows: SummaryRow[] = provinces.map((province) => {
    const sub = records.filter((r) => field(r, "province") === province);
    const cells = PROVIDER_TYPES.map((t) => {
      const seen = new Set<string>();
      for (const r of sub) {
        if (field(r, "classification") !== t.key) continue;
        const name = field(r, "institution_name");
        if (name) seen.add(name.toLowerCase());
      }
      return seen.size;
    });
    return { province, cells, total: cells.reduce((a, b) => a + b, 0) };
  });
  return finalize(columns, rows);
}

/** Build the live Summary (programs + providers) from the UTPRAS registry. */
export function computeUtprasSummary(records: UtprasRecord[], now: Date = new Date()): UtprasSummary {
  const provinces = orderedProvinces(records);
  const programs = programsMatrix(records, provinces);
  const providers = providersMatrix(records, provinces);
  return {
    provinces,
    asOf: now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    programs,
    providers,
    totalPrograms: programs.grandTotal,
    totalProviders: providers.grandTotal,
  };
}
