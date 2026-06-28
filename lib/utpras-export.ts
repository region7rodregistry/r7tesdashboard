// Client-side export helpers for the UTPRAS Registry dashboard.
//
//   • CSV   — `id` + `source_sheet` + the 30 snake_case keys, values verbatim,
//             minimal RFC-4180 quoting. Re-seedable as-is.
//   • Excel — a labeled, frozen-header, auto-filtered .xlsx via ExcelJS.
//
// ExcelJS is dynamically imported inside the handler so it stays out of the
// initial bundle.

import { UTPRAS_COLUMNS, type UtprasRecord } from "./utpras-columns";

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

const CSV_HEADER = ["id", "source_sheet", ...UTPRAS_COLUMNS.map((c) => c.key)];

/** Export the given (filtered + sorted) records as CSV in the seed layout. */
export function exportUtprasCsv(records: UtprasRecord[], filename: string): void {
  const rows: unknown[][] = [CSV_HEADER];
  for (const r of records) {
    rows.push([
      r.id,
      r.source_sheet ?? "",
      ...UTPRAS_COLUMNS.map((c) => r[c.key] ?? ""),
    ]);
  }
  downloadCsv(filename, rows);
}

/**
 * Export the given records as an organized .xlsx workbook: one sheet, human
 * labels, bold frozen header, auto-filter, sized columns, left-aligned cells.
 */
export async function exportUtprasXlsx(
  records: UtprasRecord[],
  filename: string,
  meta?: { generatedAt?: string; totalRecords?: number },
): Promise<void> {
  const ExcelJS = await loadExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = "UTPRAS Registry — TESDA Region VII";
  wb.created = new Date();

  const ws = wb.addWorksheet("UTPRAS Registry", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const headers = ["Province (Source Sheet)", ...UTPRAS_COLUMNS.map((c) => c.label)];
  ws.columns = headers.map((h: string) => ({
    header: h,
    width: Math.min(Math.max(h.length + 2, 12), 46),
    style: { alignment: { ...LEFT } },
  }));

  for (const r of records) {
    ws.addRow([
      r.source_sheet ?? "",
      ...UTPRAS_COLUMNS.map((c) => (r[c.key] ?? "") as string | number),
    ]);
  }

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND.navy}` } };
  headerRow.alignment = { ...LEFT };
  headerRow.height = 22;

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };

  for (let i = 2; i <= records.length + 1; i++) {
    if (i % 2 === 0) {
      ws.getRow(i).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF3F6FB" },
      };
    }
  }

  if (meta) {
    const info = wb.addWorksheet("About");
    info.columns = [
      { width: 26, style: { alignment: { ...LEFT } } },
      { width: 64, style: { alignment: { ...LEFT } } },
    ];
    const lines: [string, string][] = [
      ["UTPRAS Registry Export", "TESDA Region VII · Central Visayas"],
      ["Records exported", String(meta.totalRecords ?? records.length)],
      ["Generated", meta.generatedAt ?? new Date().toLocaleString()],
      [
        "Note",
        "Registered & accredited TVET programs. Reflects the filters applied at export time.",
      ],
    ];
    for (const [k, v] of lines) {
      const row = info.addRow([k, v]);
      row.getCell(1).font = { bold: true };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, filename);
}
