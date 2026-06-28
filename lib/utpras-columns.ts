// Single source of truth for the UTPRAS registry column model.
//
// Unlike the NTTC registry (which keeps spreadsheet letters as keys), the
// UTPRAS table was seeded from a clean snake_case schema (db/utpras_schema.sql),
// so we use those snake_case column names directly as the record keys. The
// bundled snapshot (data/utpras.json) and the Supabase rows share this shape.

export interface UtprasColumnDef {
  /** snake_case column name in the Supabase `utpras_registry` table. */
  key: string;
  /** Human-readable label. */
  label: string;
}

export const UTPRAS_COLUMNS: UtprasColumnDef[] = [
  { key: "region", label: "Region" },
  { key: "province", label: "Province" },
  { key: "congressional_district", label: "Congressional District" },
  { key: "municipality", label: "Municipality" },
  { key: "municipality_class", label: "Municipality Class" },
  { key: "unique_institution_id", label: "Unique Institution ID (UIID)" },
  { key: "institution_name", label: "Name of Institution" },
  { key: "formerly_name", label: "Formerly Name of TVI" },
  { key: "institution_head", label: "Head of Institution" },
  { key: "address", label: "Address" },
  { key: "latitude", label: "Latitude" },
  { key: "longitude", label: "Longitude" },
  { key: "tel_no", label: "Contact Number" },
  { key: "email", label: "Email Address" },
  { key: "institution_type", label: "Type of Institution" },
  { key: "classification", label: "Classification of Institution" },
  { key: "status", label: "Status" },
  { key: "sector", label: "Sector" },
  { key: "course_program", label: "Qualification / Registered Program" },
  { key: "pqf_level", label: "PQF Level" },
  { key: "duration", label: "Duration" },
  { key: "program_reg_no", label: "Program Registration No." },
  { key: "date_issued", label: "Date Issued" },
  { key: "expiration_date", label: "Expiration Date" },
  { key: "trainer", label: "Trainer" },
  { key: "nttc", label: "NTTC" },
  { key: "nttc_expiration_date", label: "NTTC Expiration Date" },
  { key: "date_conducted", label: "Date Conducted" },
  { key: "result", label: "Result" },
  { key: "original_date_of_registration", label: "Original Date of Registration" },
];

/** A UTPRAS registry record: a stable numeric id, the source sheet, and the
 *  snake_case columns above (string | null). */
export interface UtprasRecord {
  id: number;
  source_sheet?: string | null;
  [key: string]: string | number | null | undefined;
}

export const UTPRAS_TABLE_NAME = "utpras_registry";
