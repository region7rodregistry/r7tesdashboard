// Client-side export helpers for the PTCACs registries (assessment centers +
// assessors). Generic over a column model so both registries share one
// implementation:
//   • CSV   — `id` + `source_sheet` + the snake_case keys, values verbatim,
//             minimal RFC-4180 quoting. Re-seedable as-is.
//   • Excel — a labeled, frozen-header, auto-filtered .xlsx via ExcelJS.
//
// ExcelJS is dynamically imported inside the handler so it stays out of the
// initial bundle.

import type { PtcacsColumnDef, PtcacsRecord } from "./ptcacs-columns";

const BRAND = { navy: "0A2463" } as const;
const LEFT = { horizontal: "left", vertical: "middle" } as const;

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Quote a field only when it contains a comma, quote, or newline. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

/** UTF-8 with BOM so Excel reads accents (ñ, é) correctly. */
function downloadCsv(filename: string, rows: unknown[][]): void {
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadExcelJS(): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import("exceljs");
  return mod.default ?? mod;
}

/** Export the given (filtered + sorted) records as CSV in the seed layout. */
export function exportPtcacsCsv(
  records: PtcacsRecord[],
  columns: PtcacsColumnDef[],
  filename: string,
): void {
  const header = ["id", "source_sheet", ...columns.map((c) => c.key)];
  const rows: unknown[][] = [header];
  for (const r of records) {
    rows.push([r.id, r.source_sheet ?? "", ...columns.map((c) => r[c.key] ?? "")]);
  }
  downloadCsv(filename, rows);
}

/**
 * Export the given records as an organized .xlsx workbook: one sheet, human
 * labels, bold frozen header, auto-filter, sized columns, left-aligned cells.
 */
export async function exportPtcacsXlsx(
  records: PtcacsRecord[],
  columns: PtcacsColumnDef[],
  filename: string,
  meta: { sheetName: string; title: string; note: string; generatedAt?: string; totalRecords?: number },
): Promise<void> {
  const ExcelJS = await loadExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = `${meta.title} — TESDA Region VII`;
  wb.created = new Date();

  const ws = wb.addWorksheet(meta.sheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const headers = columns.map((c) => c.label);
  ws.columns = headers.map((h: string) => ({
    header: h,
    width: Math.min(Math.max(h.length + 2, 12), 46),
    style: { alignment: { ...LEFT } },
  }));

  for (const r of records) {
    ws.addRow(columns.map((c) => (r[c.key] ?? "") as string | number));
  }

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND.navy}` } };
  headerRow.alignment = { ...LEFT };
  headerRow.height = 22;

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };

  for (let i = 2; i <= records.length + 1; i++) {
    if (i % 2 === 0) {
      ws.getRow(i).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F6FB" } };
    }
  }

  const info = wb.addWorksheet("About");
  info.columns = [
    { width: 26, style: { alignment: { ...LEFT } } },
    { width: 64, style: { alignment: { ...LEFT } } },
  ];
  const lines: [string, string][] = [
    [meta.title, "TESDA Region VII · Central Visayas"],
    ["Records exported", String(meta.totalRecords ?? records.length)],
    ["Generated", meta.generatedAt ?? new Date().toLocaleString()],
    ["Note", meta.note],
  ];
  for (const [k, v] of lines) {
    const row = info.addRow([k, v]);
    row.getCell(1).font = { bold: true };
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, filename);
}
