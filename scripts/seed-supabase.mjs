// Seed the Supabase `nttc_registry` table from db/seed_consolidated_dec2025.csv
// using the service-role key (bypasses RLS, no SQL-editor size limit).
//
//   node scripts/seed-supabase.mjs --check   # read-only: connectivity + row count
//   node scripts/seed-supabase.mjs           # seed: upsert-by-id, then prune extras
//
// Mirrors lib/sync.ts: upsert in 500-row chunks (never empties the table
// mid-run), then delete ids beyond the new max. Re-runnable / idempotent.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSV = join(ROOT, "db", "seed_consolidated_dec2025.csv");
const TABLE = "nttc_registry";
const CHUNK = 500;
const EXPECTED_COLS = 39;
const checkOnly = process.argv.includes("--check");

// ── load .env.local (no dotenv dependency) ──────────────────────────────────
function loadEnv() {
  const env = {};
  let text;
  try {
    text = readFileSync(join(ROOT, ".env.local"), "utf8");
  } catch {
    return env;
  }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || line.trimStart().startsWith("#")) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

// ── RFC-4180 CSV parser (handles quotes, doubled quotes, embedded newlines) ──
function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); field = ""; rows.push(row); row = [];
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("✖ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// ── connectivity / table preflight ──────────────────────────────────────────
const { count: currentCount, error: countErr } = await supabase
  .from(TABLE)
  .select("*", { count: "exact", head: true });
if (countErr) {
  console.error(`✖ Cannot read ${TABLE}: ${countErr.message}`);
  console.error("  → If the table is missing, run db/schema.sql in the Supabase SQL editor first (it's tiny and fits).");
  process.exit(1);
}
console.log(`✓ Connected. ${TABLE} currently has ${currentCount} row(s).`);
if (checkOnly) process.exit(0);

// ── parse CSV → row objects ─────────────────────────────────────────────────
const cells = parseCsv(readFileSync(CSV, "utf8"));
const header = cells[0];
if (!header || header.length !== EXPECTED_COLS) {
  console.error(`✖ CSV header has ${header ? header.length : 0} columns, expected ${EXPECTED_COLS}. Aborting.`);
  process.exit(1);
}
const body = cells.slice(1).filter((r) => r.length === EXPECTED_COLS);
const rows = body.map((r) => {
  const o = {};
  header.forEach((h, idx) => {
    const v = r[idx];
    o[h] = v === undefined || v === "" ? null : v;
  });
  o.id = Number(o.id);
  return o;
});
const maxId = rows.length;
if (rows.length !== body.length || body.length !== cells.length - 1) {
  console.error(`✖ Row-count mismatch after parse (parsed ${cells.length - 1}, well-formed ${body.length}). Aborting.`);
  process.exit(1);
}
console.log(`✓ Parsed ${rows.length} rows from ${CSV.replace(ROOT + "\\", "").replace(ROOT + "/", "")}.`);

// ── upsert in chunks, then prune ────────────────────────────────────────────
for (let i = 0; i < rows.length; i += CHUNK) {
  const slice = rows.slice(i, i + CHUNK);
  const { error } = await supabase.from(TABLE).upsert(slice, { onConflict: "id" });
  if (error) {
    console.error(`✖ Upsert failed at row ${i + 1}: ${error.message}`);
    process.exit(1);
  }
  console.log(`  …upserted ${Math.min(i + CHUNK, rows.length)} / ${rows.length}`);
}
const { error: pruneErr } = await supabase.from(TABLE).delete().gt("id", maxId);
if (pruneErr) {
  console.error(`✖ Upserted OK but prune failed: ${pruneErr.message}`);
  process.exit(1);
}

const { count: finalCount } = await supabase.from(TABLE).select("*", { count: "exact", head: true });
console.log(`✓ Done. ${TABLE} now has ${finalCount} row(s).`);
