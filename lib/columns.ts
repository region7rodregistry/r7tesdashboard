// Single source of truth for the NTTC registry column model.
//
// The source spreadsheet uses spreadsheet-letter columns (A..AL). We keep those
// letters as the canonical record keys (so the bundled records.json, the Supabase
// rows, and the Google-Sheet sync all line up), and attach a snake_case database
// column name + a human label to each one.

export interface ColumnDef {
  /** Spreadsheet column letter — the key used inside a NttcRecord. */
  letter: string;
  /** snake_case column name in the Supabase `nttc_registry` table. */
  key: string;
  /** Human-readable label. */
  label: string;
}

export const COLUMNS: ColumnDef[] = [
  { letter: "A", key: "region", label: "Region" },
  { letter: "B", key: "province", label: "Province" },
  { letter: "C", key: "last_name", label: "Last Name" },
  { letter: "D", key: "first_name", label: "First Name" },
  { letter: "E", key: "middle_initial", label: "Middle Initial" },
  { letter: "F", key: "extension_name", label: "Extension" },
  { letter: "G", key: "birthday", label: "Birthday" },
  { letter: "H", key: "sex", label: "Sex" },
  { letter: "I", key: "complete_address", label: "Complete Address" },
  { letter: "J", key: "email_address", label: "Email Address" },
  { letter: "K", key: "contact_number", label: "Contact Number" },
  { letter: "L", key: "educational_attainment", label: "Educational Attainment" },
  { letter: "M", key: "training_institution", label: "Training Institution / Company" },
  { letter: "N", key: "institution_type", label: "Type of Training Institution" },
  { letter: "O", key: "years_training", label: "Years of Experience (Training)" },
  { letter: "P", key: "years_practicing", label: "Years Practicing the Qualification" },
  { letter: "Q", key: "sector", label: "Sector" },
  { letter: "R", key: "qualification", label: "Qualification" },
  { letter: "S", key: "nc_certificate_number", label: "NC Certificate Number" },
  { letter: "T", key: "nc_date_issued", label: "NC Date Issued" },
  { letter: "U", key: "nc_expiration_date", label: "NC Expiration Date" },
  { letter: "V", key: "tm_certificate_number", label: "TM Certificate Number" },
  { letter: "W", key: "tm_date_issued", label: "TM Date Issued" },
  { letter: "X", key: "tm_expiration_date", label: "TM Expiration Date" },
  { letter: "Y", key: "assessor_panel_1", label: "Assessor (Panel 1)" },
  { letter: "Z", key: "assessor_panel_2", label: "Assessor (Panel 2)" },
  { letter: "AA", key: "assessor_panel_3", label: "Assessor (Panel 3)" },
  { letter: "AB", key: "nttc_certificate_number", label: "NTTC Certificate Number" },
  { letter: "AC", key: "nttc_date_issued", label: "NTTC Date Issued" },
  { letter: "AD", key: "nttc_expiration_date", label: "NTTC Expiration Date (Validity)" },
  { letter: "AE", key: "cln_ntc_number", label: "CLN-NTC Number (Control Number)" },
  { letter: "AF", key: "remarks", label: "Remarks" },
  { letter: "AG", key: "nttc_type", label: "New NTTC or Renewal" },
  { letter: "AH", key: "employment_type", label: "Type of Employment" },
  { letter: "AI", key: "employment_status", label: "Status of Employment" },
  { letter: "AJ", key: "expiration_match_nc", label: "NTTC Expiration Same as NC" },
  { letter: "AK", key: "month_issued", label: "Month Issued" },
  { letter: "AL", key: "year_issued", label: "Year Issued" },
];

/** A registry record: spreadsheet letters A..AL plus a stable numeric id. */
export interface NttcRecord {
  id: number;
  [letter: string]: string | number | null | undefined;
}

/** Map snake_case db column -> spreadsheet letter, for translating Supabase rows. */
export const KEY_TO_LETTER: Record<string, string> = Object.fromEntries(
  COLUMNS.map((c) => [c.key, c.letter]),
);

/** Map spreadsheet letter -> snake_case db column, for building Supabase rows. */
export const LETTER_TO_KEY: Record<string, string> = Object.fromEntries(
  COLUMNS.map((c) => [c.letter, c.key]),
);

export const TABLE_NAME = "nttc_registry";
