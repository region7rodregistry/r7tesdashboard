// One-shot generator: reads the two PTCAC Excel registries and emits
//   • data/assessment-centers.json   (bundled snapshot)
//   • data/assessors.json            (bundled snapshot)
//   • db/assessment_centers_seed.sql  (idempotent INSERTs)
//   • db/assessors_seed.sql           (idempotent INSERTs)
// Run from the project root:  node scripts/gen-ptcacs.mjs
import ExcelJS from "exceljs";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ── helpers ────────────────────────────────────────────────────────────────
function cellText(v) {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return isoFromDate(v);
  if (typeof v === "object") {
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join("");
    if (v.text !== undefined) return String(v.text);
    if (v.result !== undefined) return String(v.result);
    if (v.hyperlink) return String(v.text ?? v.hyperlink);
    return "";
  }
  return String(v);
}

const pad = (n) => String(n).padStart(2, "0");
function isoFromDate(d) {
  // Use UTC parts — ExcelJS materializes spreadsheet dates at UTC midnight.
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// Normalize a date-ish string to ISO (YYYY-MM-DD). Returns the input verbatim
// (trimmed) if it isn't a recognizable date, and "" for blanks.
function normDate(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let [, mm, dd, yy] = m;
    let year = Number(yy);
    if (yy.length === 2) year += year < 50 ? 2000 : 1900;
    const mo = Number(mm), da = Number(dd);
    if (mo >= 1 && mo <= 12 && da >= 1 && da <= 31) {
      return `${year}-${pad(mo)}-${pad(da)}`;
    }
  }
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${pad(Number(iso[2]))}-${pad(Number(iso[3]))}`;
  return s; // leave anything else verbatim
}

// The four real Region VII provinces. The source TMIS export occasionally
// files an office code (e.g. "CO" = Central Office, accreditation province-code
// "00") in the PROVINCE cell instead of a province. Those aren't provinces, so
// we null them — otherwise they surface as stray options in the Province filter
// and inflate the province count. Anything else is kept verbatim.
const REGION_VII_PROVINCES = new Set(["Cebu", "Bohol", "Negros Oriental", "Siquijor"]);

function clean(raw) {
  // Collapse interior runs of spaces/tabs but PRESERVE newlines (multi-value
  // cells stack values on separate lines, mirroring the UTPRAS seed).
  return String(raw ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .trim();
}

function sqlVal(v) {
  if (v === null || v === undefined || v === "") return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}

// ── config per registry ──────────────────────────────────────────────────────
const CONFIGS = [
  {
    file: "5. Registry of Accredited Compentency Assessment Center - Training Management Info System.xlsx",
    table: "assessment_centers",
    json: "data/assessment-centers.json",
    seed: "db/assessment_centers_seed.sql",
    titleField: "assessment_center",
    label: "Assessment Centers",
    // [excelIndex, key, isDate]
    cols: [
      [0, "region", false],
      [1, "province", false],
      [2, "assessment_center", false],
      [3, "address", false],
      [4, "longitude", false],
      [5, "latitude", false],
      [6, "center_manager", false],
      [7, "tel_no", false],
      [8, "sector", false],
      [9, "qualification_title", false],
      [10, "accreditation_number", false],
      [11, "date_accredited", true],
      [12, "valid_until", true],
    ],
  },
  {
    file: "5. Registry of Accredited Compentency Assessors - Training Management Info System.xlsx",
    table: "competency_assessors",
    json: "data/assessors.json",
    seed: "db/assessors_seed.sql",
    titleField: "name",
    label: "Assessors",
    cols: [
      [0, "region", false],
      [1, "province", false],
      [2, "name", false],
      [3, "address", false],
      [4, "sex", false],
      [5, "date_of_birth", true],
      [6, "educational_attainment", false],
      [7, "present_designation", false],
      [8, "company_name", false],
      [9, "sector", false],
      [10, "qualification_title", false],
      [11, "accreditation_number", false],
      [12, "date_of_accreditation", true],
      [13, "valid_until", true],
    ],
  },
];

async function run() {
  for (const cfg of CONFIGS) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(join(ROOT, cfg.file));
    const ws = wb.worksheets[0];

    const records = [];
    const titleIdx = cfg.cols.find((c) => c[1] === cfg.titleField)[0];

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const title = clean(cellText(row.getCell(titleIdx + 1).value));
      if (!title) continue; // skip blank/trailing rows

      const rec = { id: records.length + 1, source_sheet: null };
      for (const [idx, key, isDate] of cfg.cols) {
        let val = clean(cellText(row.getCell(idx + 1).value));
        if (isDate) val = normDate(val);
        rec[key] = val === "" ? null : val;
      }
      // Drop non-province office codes (see REGION_VII_PROVINCES note).
      if (rec.province && !REGION_VII_PROVINCES.has(rec.province)) {
        console.warn(`  [${cfg.label}] nulling non-province "${rec.province}" on row id ${rec.id} (${title})`);
        rec.province = null;
      }
      records.push(rec);
    }

    // JSON snapshot
    writeFileSync(join(ROOT, cfg.json), JSON.stringify(records, null, 2) + "\n", "utf8");

    // SQL seed
    const keys = ["id", "source_sheet", ...cfg.cols.map((c) => c[1])];
    const lines = [];
    lines.push("-- =====================================================================");
    lines.push(`-- PTCACs — Accredited Competency ${cfg.label} — Region VII (TESDA)`);
    lines.push(`-- seed data (${records.length} records)`);
    lines.push("-- Run db/ptcacs_schema.sql first, then this file (Supabase SQL editor).");
    lines.push("-- IDEMPOTENT: TRUNCATE first, so re-running always ends at the same count.");
    lines.push("-- All source values preserved verbatim as TEXT; dates normalized to ISO.");
    lines.push("-- =====================================================================");
    lines.push("");
    lines.push("BEGIN;");
    lines.push("");
    lines.push(`TRUNCATE TABLE ${cfg.table};`);
    lines.push("");
    lines.push(`INSERT INTO ${cfg.table} (${keys.join(", ")}) VALUES`);
    const valueRows = records.map((rec) => {
      const vals = keys.map((k) => (k === "id" ? rec.id : sqlVal(rec[k])));
      return `  (${vals.join(", ")})`;
    });
    lines.push(valueRows.join(",\n") + ";");
    lines.push("");
    lines.push("COMMIT;");
    lines.push("");
    writeFileSync(join(ROOT, cfg.seed), lines.join("\n"), "utf8");

    console.log(`${cfg.label}: ${records.length} records → ${cfg.json}, ${cfg.seed}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
