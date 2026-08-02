// Client-side export helpers for the NTTC Registry dashboard.
//
// Three output formats are produced entirely in the browser:
//   • CSV   — plain text, written with the SAME column layout the database was
//             seeded from (db/seed_consolidated_dec2025.csv): an `id` column
//             followed by the 38 snake_case keys, values verbatim, minimal
//             RFC-4180 quoting. So an exported file can be re-seeded as-is.
//   • Excel — a "properly organized" .xlsx (human labels, bold frozen header,
//             auto-filter, sized columns) via ExcelJS.
//   • PDF   — a clean statistics report (TESDA logo, attribution, per-count
//             tables) via jsPDF + jspdf-autotable.
//
// The heavy libraries (exceljs, jspdf) are dynamically imported inside the
// handlers so they stay out of the initial bundle and never touch the server.

import { COLUMNS, type NttcRecord } from "./columns";

// ── TESDA brand palette (matches .bg-tesda-header) ──────────────────────────
const BRAND = { navy: "0A2463", deepNavy: "001933" } as const;
const BRAND_RGB = { navy: [10, 36, 99] as [number, number, number] };

// ── low-level download primitives ───────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the click has surely started the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function dateStamp(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Human-readable date for filenames/titles, e.g. "April 6, 2026". */
export function prettyDate(d: Date = new Date()): string {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ── CSV (minimal RFC-4180 quoting, matching the seed file's style) ───────────
/** Quote a field only when it contains a comma, quote, or newline. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: (unknown[])[]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

/** Write a CSV string to disk (UTF-8 with BOM so Excel reads accents correctly). */
function downloadCsv(filename: string, rows: (unknown[])[]): void {
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

// ── ExcelJS / jsPDF dynamic loaders (interop-safe) ───────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
async function loadExcelJS(): Promise<any> {
  const mod: any = await import("exceljs");
  return mod.default ?? mod;
}

/** Drill through ESM/CJS interop wrappers to find the callable export. */
function resolveCallable(m: any): any {
  for (const candidate of [m, m?.default, m?.default?.default]) {
    if (typeof candidate === "function") return candidate;
  }
  return undefined;
}

async function loadJsPdf(): Promise<{ JsPDF: any; autoTable: any }> {
  const pdfMod: any = await import("jspdf");
  const JsPDF = pdfMod.jsPDF ?? pdfMod.default ?? pdfMod;
  const atMod: any = await import("jspdf-autotable");
  const autoTable = resolveCallable(atMod);
  if (typeof autoTable !== "function") {
    throw new Error("Could not resolve the jspdf-autotable function export.");
  }
  return { JsPDF, autoTable };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// =============================================================================
// REGISTRY EXPORTS (record-level, filter-adaptive)
// =============================================================================

/** Header used for the registry CSV — identical to the seed file's header. */
const REGISTRY_CSV_HEADER = ["id", ...COLUMNS.map((c) => c.key)];

/**
 * Export the given (already filtered + sorted) records as CSV in the exact
 * layout the table was seeded from: `id` + snake_case keys, values verbatim.
 */
export function exportRegistryCsv(records: NttcRecord[], filename: string): void {
  const rows: unknown[][] = [REGISTRY_CSV_HEADER];
  for (const r of records) {
    rows.push([r.id, ...COLUMNS.map((c) => r[c.letter] ?? "")]);
  }
  downloadCsv(filename, rows);
}

/**
 * Excel column layout — mirrors the official RO 2026 NTTC registry headers
 * ("follow the column formatting" of the source CSV).
 */
const REGISTRY_XLSX_COLUMNS: { letter: string; header: string; valueLetter?: string }[] = [
  { letter: "A", header: "Region" },
  { letter: "B", header: "Province" },
  { letter: "C", header: "Last Name" },
  { letter: "D", header: "First Name" },
  { letter: "E", header: "Middle Initial" },
  { letter: "F", header: "Extension" },
  { letter: "G", header: "Birthday (MM/DD/YYYY)" },
  { letter: "H", header: "Sex" },
  { letter: "I", header: "Complete Address" },
  { letter: "J", header: "Email Address" },
  { letter: "K", header: "Contact Number" },
  { letter: "L", header: "Educational Attainment" },
  { letter: "M", header: "Name of Training Institution / Company" },
  { letter: "N", header: "Type of Training Institution (Public/Private)" },
  { letter: "O", header: "Years of Experience — Training" },
  { letter: "P", header: "Years of Experience — Practicing the Qualification" },
  { letter: "Q", header: "Sector" },
  { letter: "R", header: "Qualification" },
  { letter: "S", header: "NC — Certificate Number" },
  { letter: "T", header: "NC — Date Issued (MM/DD/YYYY)" },
  { letter: "U", header: "NC — Expiration Date (MM/DD/YYYY)" },
  { letter: "V", header: "TM — Certificate Number" },
  { letter: "W", header: "TM — Date Issued (MM/DD/YYYY)" },
  { letter: "X", header: "TM — Expiration Date (MM/DD/YYYY)" },
  { letter: "Y", header: "Assessed By — Panel 1" },
  { letter: "Z", header: "Assessed By — Panel 2" },
  { letter: "AA", header: "Assessed By — Panel 3" },
  { letter: "AB", header: "NTTC — Certificate Number" },
  { letter: "AC", header: "NTTC — Date Issued (MM/DD/YYYY)" },
  { letter: "AD", header: "NTTC — Expiration Date (MM/DD/YYYY)" },
  { letter: "AE", header: "CLN-NTC Number" },
];

const LEFT = { horizontal: "left", vertical: "middle" } as const;

/**
 * Export the given records as a properly organized .xlsx workbook: one sheet,
 * source-faithful headers, bold frozen header row, auto-filter, sized columns,
 * and every cell left-aligned.
 */
export async function exportRegistryXlsx(
  records: NttcRecord[],
  filename: string,
  meta?: { generatedAt?: string; totalRecords?: number },
): Promise<void> {
  const ExcelJS = await loadExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = "NTTC Registry — TESDA Region VII";
  wb.created = new Date();

  const ws = wb.addWorksheet("NTTC Registry", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const headers = REGISTRY_XLSX_COLUMNS.map((c) => c.header);
  ws.columns = headers.map((h) => ({
    header: h,
    // Width heuristic: header length, clamped to a sensible range.
    width: Math.min(Math.max(h.length + 2, 12), 42),
    // Left-align the whole column (header + every data cell).
    style: { alignment: { ...LEFT } },
  }));

  for (const r of records) {
    ws.addRow(
      REGISTRY_XLSX_COLUMNS.map((c) => (r[c.valueLetter ?? c.letter] ?? "") as string | number),
    );
  }

  // Style the header row (keep the left alignment from the column style).
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: `FF${BRAND.navy}` },
  };
  headerRow.alignment = { ...LEFT };
  headerRow.height = 22;

  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };

  // Light zebra striping for readability.
  for (let i = 2; i <= records.length + 1; i++) {
    if (i % 2 === 0) {
      ws.getRow(i).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF3F6FB" },
      };
    }
  }

  // Optional caption sheet so the export is self-describing.
  if (meta) {
    const info = wb.addWorksheet("About");
    info.columns = [
      { width: 26, style: { alignment: { ...LEFT } } },
      { width: 60, style: { alignment: { ...LEFT } } },
    ];
    const lines: [string, string][] = [
      ["NTTC Registry Export", "TESDA Region VII · Central Visayas"],
      ["Records exported", String(meta.totalRecords ?? records.length)],
      ["Generated", meta.generatedAt ?? new Date().toLocaleString()],
      [
        "Note",
        "Generated by the online NTTC Registry of TESDA Region VII. Reflects the filters applied at export time.",
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

// =============================================================================
// STATISTICS EXPORTS (aggregate, reflects the selected status tab)
// =============================================================================

export interface StatSlice {
  label: string;
  value: number;
}
export interface StatSection {
  title: string;
  slices: StatSlice[];
}
export interface StatsExportMeta {
  statusLabel: string; // e.g. "All Records", "Valid"
  generatedAt: string; // human-formatted timestamp
  summary: StatSlice[]; // Records / Provinces / Sectors / Qualifications
  // Branding overrides so UTPRAS / PTCACs can reuse the same machinery. Each
  // defaults to the NTTC registry values when omitted (backward compatible).
  reportTitle?: string; // e.g. "UTPRAS Registry — Statistics"
  reportSubtitle?: string; // e.g. "TESDA Region VII · Central Visayas"
  attribution?: string; // footer line
}

const DEFAULT_TITLE = "NTTC Registry — Statistics";
const DEFAULT_SUBTITLE = "TESDA Region VII · Central Visayas";
const ATTRIBUTION = "This report was generated by the online NTTC Registry of TESDA Region VII.";

function pct(value: number, total: number): string {
  if (!total) return "0.0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

/** One flat CSV stacking every breakdown: Breakdown, Category, Count, % of group. */
export function exportStatisticsCsv(
  meta: StatsExportMeta,
  sections: StatSection[],
  filename: string,
): void {
  const rows: unknown[][] = [];
  rows.push([meta.reportTitle ?? DEFAULT_TITLE, meta.reportSubtitle ?? DEFAULT_SUBTITLE]);
  rows.push(["Status filter", meta.statusLabel]);
  rows.push(["Generated", meta.generatedAt]);
  for (const s of meta.summary) rows.push([s.label, s.value]);
  rows.push([]);
  rows.push(["Breakdown", "Category", "Count", "% of group"]);
  for (const section of sections) {
    const total = section.slices.reduce((sum, s) => sum + s.value, 0);
    for (const slice of section.slices) {
      rows.push([section.title, slice.label, slice.value, pct(slice.value, total)]);
    }
  }
  rows.push([]);
  rows.push([meta.attribution ?? ATTRIBUTION]);
  downloadCsv(filename, rows);
}

/** Multi-sheet workbook: a Summary sheet + one sheet per breakdown. */
export async function exportStatisticsXlsx(
  meta: StatsExportMeta,
  sections: StatSection[],
  filename: string,
): Promise<void> {
  const ExcelJS = await loadExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = meta.reportTitle ?? DEFAULT_TITLE;
  wb.created = new Date();
  const attribution = meta.attribution ?? ATTRIBUTION;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styleHeader = (ws: any, cols: number) => {
    const row = ws.getRow(1);
    row.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND.navy}` } };
    row.alignment = { ...LEFT };
    row.height = 22;
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
  };

  // Summary sheet.
  const summary = wb.addWorksheet("Summary");
  summary.columns = [
    { width: 30, style: { alignment: { ...LEFT } } },
    { width: 22, style: { alignment: { ...LEFT } } },
  ];
  summary.addRow(["Metric", "Value"]);
  styleHeader(summary, 2);
  summary.addRow(["Status filter", meta.statusLabel]);
  summary.addRow(["Generated", meta.generatedAt]);
  for (const s of meta.summary) summary.addRow([s.label, s.value]);
  summary.addRow([]);
  summary.addRow([attribution]);

  // One sheet per breakdown.
  const usedNames = new Set<string>(["Summary"]);
  for (const section of sections) {
    // Sheet names: <=31 chars, no []*?/\: and must be unique.
    let name = section.title.replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Sheet";
    let n = 2;
    while (usedNames.has(name)) name = `${name.slice(0, 28)} ${n++}`;
    usedNames.add(name);

    const ws = wb.addWorksheet(name);
    ws.columns = [
      { width: 46, style: { alignment: { ...LEFT } } },
      { width: 12, style: { alignment: { ...LEFT } } },
      { width: 14, style: { alignment: { ...LEFT } } },
    ];
    ws.addRow(["Category", "Count", "% of total"]);
    styleHeader(ws, 3);
    const total = section.slices.reduce((sum, s) => sum + s.value, 0);
    for (const slice of section.slices) {
      ws.addRow([slice.label, slice.value, pct(slice.value, total)]);
    }
    // Total row.
    const totalRow = ws.addRow(["Total", total, "100.0%"]);
    totalRow.font = { bold: true };
    totalRow.getCell(1).border = { top: { style: "thin" } };
    totalRow.getCell(2).border = { top: { style: "thin" } };
    totalRow.getCell(3).border = { top: { style: "thin" } };
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, filename);
}

// ── PDF logo loader ──────────────────────────────────────────────────────────
async function loadImage(
  src: string,
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = dataUrl;
    });
    return { dataUrl, width: dims.w, height: dims.h };
  } catch {
    return null;
  }
}

/**
 * Clean statistics PDF: TESDA logo + title block at the top, a summary strip,
 * a per-count table for every breakdown, and the attribution line in the footer
 * of every page.
 */
export async function exportStatisticsPdf(
  meta: StatsExportMeta,
  sections: StatSection[],
  filename: string,
  logoSrc = "/icons/tlogo.png",
): Promise<void> {
  const { JsPDF, autoTable } = await loadJsPdf();
  const logo = await loadImage(logoSrc);

  const reportTitle = meta.reportTitle ?? DEFAULT_TITLE;
  const reportSubtitle = meta.reportSubtitle ?? DEFAULT_SUBTITLE;
  const attribution = meta.attribution ?? ATTRIBUTION;

  const doc = new JsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const [r, g, b] = BRAND_RGB.navy;

  // ── Header band ────────────────────────────────────────────────────────────
  let cursorY = margin;
  let textX = margin;
  if (logo && logo.width && logo.height) {
    const logoH = 50;
    const logoW = (logo.width / logo.height) * logoH;
    doc.addImage(logo.dataUrl, "PNG", margin, cursorY, logoW, logoH);
    textX = margin + logoW + 14;
  }

  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text(reportTitle, textX, cursorY + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(reportSubtitle, textX, cursorY + 32);
  doc.text(
    `Status: ${meta.statusLabel}    |    Generated: ${meta.generatedAt}`,
    textX,
    cursorY + 46,
  );

  cursorY += 64;
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(1.2);
  doc.line(margin, cursorY, pageW - margin, cursorY);
  cursorY += 14;

  // ── Summary strip (one compact table) ────────────────────────────────────────
  autoTable(doc, {
    startY: cursorY,
    head: [meta.summary.map((s) => s.label)],
    body: [meta.summary.map((s) => s.value.toLocaleString())],
    theme: "grid",
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [r, g, b], textColor: 255, halign: "center", fontStyle: "bold" },
    bodyStyles: { halign: "center", fontSize: 13, fontStyle: "bold", textColor: [30, 30, 30] },
    styles: { cellPadding: 6 },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cursorY = (doc as any).lastAutoTable.finalY + 18;

  // ── One table per breakdown ──────────────────────────────────────────────────
  for (const section of sections) {
    const total = section.slices.reduce((sum, s) => sum + s.value, 0);
    autoTable(doc, {
      startY: cursorY,
      head: [[section.title, "Count", "% of total"]],
      body: section.slices.map((s) => [s.label, s.value.toLocaleString(), pct(s.value, total)]),
      foot: [["Total", total.toLocaleString(), "100.0%"]],
      theme: "striped",
      margin: { left: margin, right: margin, bottom: 48 },
      headStyles: { fillColor: [r, g, b], textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [232, 237, 247], textColor: [20, 20, 20], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [247, 249, 252] },
      columnStyles: {
        1: { halign: "right", cellWidth: 70 },
        2: { halign: "right", cellWidth: 80 },
      },
      styles: { cellPadding: 5, fontSize: 9.5, overflow: "linebreak" },
      // Footer attribution + page number on every page this table spans.
      didDrawPage: () => {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(attribution, margin, pageH - 24);
        const page = doc.internal.getNumberOfPages();
        doc.text(`Page ${page}`, pageW - margin, pageH - 24, { align: "right" });
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cursorY = (doc as any).lastAutoTable.finalY + 18;
  }

  doc.save(filename);
}
