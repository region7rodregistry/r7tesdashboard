import { COLUMNS, type NttcRecord } from "./columns";

/**
 * RFC-4180-ish CSV parser. Handles quoted fields, escaped quotes ("") and
 * embedded newlines inside quotes — which the NTTC sheet uses heavily in its
 * multi-line header cells.
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  const Q = '"';

  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (inQuotes) {
      if (c === Q) {
        if (input[i + 1] === Q) {
          cur += Q;
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === Q) {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") {
      cur += c;
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

const clean = (v: string | undefined): string | null => {
  if (v === undefined || v === null) return null;
  const t = String(v).replace(/\s+/g, " ").trim();
  return t === "" ? null : t;
};

/** A->0, B->1 ... AE->30 */
function letterToIndex(letter: string): number {
  let n = 0;
  for (const ch of letter) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

const COLUMN_INDEX: { letter: string; idx: number }[] = COLUMNS.map((c) => ({
  letter: c.letter,
  idx: letterToIndex(c.letter),
}));

/**
 * Convert the raw NTTC sheet (header rows 0-2, data from row 3) into records.
 * A row is kept only if it has a last name, first name OR province — the sheet
 * is padded with hundreds of empty template rows that contain only the region.
 */
export function rowsToRecords(rows: string[][]): NttcRecord[] {
  const DATA_START = 3;
  const records: NttcRecord[] = [];
  for (let r = DATA_START; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const last = clean(row[letterToIndex("C")]);
    const first = clean(row[letterToIndex("D")]);
    const province = clean(row[letterToIndex("B")]);
    if (!last && !first && !province) continue;

    const rec: NttcRecord = { id: records.length + 1 };
    for (const { letter, idx } of COLUMN_INDEX) {
      rec[letter] = clean(row[idx]);
    }
    records.push(rec);
  }
  return records;
}

/** Parse a CSV string straight into registry records. */
export function csvToRecords(csv: string): NttcRecord[] {
  return rowsToRecords(parseCsv(csv));
}

/**
 * Guard against silent column drift before a sync overwrites Supabase.
 * The sheet is parsed positionally (by spreadsheet letter), so an inserted or
 * reordered column would otherwise misalign every field. We assert a handful of
 * anchor header labels at their expected positions; on mismatch the caller
 * should refuse to write. Returns an error message, or null when the layout
 * looks correct.
 */
export function validateNttcHeader(rows: string[][]): string | null {
  if (rows.length < 4) return "Sheet has fewer than 4 rows — header/data layout is unexpected.";
  if ((rows[0]?.length ?? 0) < 31) {
    return `Expected at least 31 columns, found ${rows[0]?.length ?? 0}. The sheet layout has changed.`;
  }
  const anchors: { row: number; col: number; expect: string }[] = [
    { row: 0, col: 1, expect: "PROVINCE" },
    { row: 1, col: 2, expect: "LAST NAME" },
    { row: 1, col: 3, expect: "FIRST NAME" },
    { row: 0, col: 17, expect: "QUALIFICATION" },
    { row: 0, col: 27, expect: "NTTC" },
    { row: 0, col: 30, expect: "CLN" },
  ];
  const mismatches: string[] = [];
  for (const a of anchors) {
    const cell = (rows[a.row]?.[a.col] ?? "").replace(/\s+/g, " ").trim().toUpperCase();
    if (!cell.includes(a.expect)) {
      mismatches.push(`column index ${a.col} (expected "${a.expect}", found "${cell || "∅"}")`);
    }
  }
  if (mismatches.length) {
    return `Sheet column layout does not match the expected NTTC template — refusing to overwrite. Mismatches: ${mismatches.join("; ")}.`;
  }
  return null;
}

/** Build the Google Sheets CSV export URL for a given sheet + tab (gid). */
export function googleSheetCsvUrl(sheetId: string, gid: string | number = 0): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}
