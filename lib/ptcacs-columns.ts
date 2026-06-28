// Single source of truth for the PTCACs column models — the two Competency
// Assessment registries. Both tables were seeded from clean snake_case schemas
// (db/ptcacs_schema.sql), so the snake_case column names double as record keys.
// The bundled snapshots (data/assessment-centers.json, data/assessors.json) and
// the Supabase rows share these shapes.

export interface PtcacsColumnDef {
  /** snake_case column name in the Supabase table. */
  key: string;
  /** Human-readable label. */
  label: string;
}

// ── Accredited Competency Assessment Centers ────────────────────────────────
export const CENTER_COLUMNS: PtcacsColumnDef[] = [
  { key: "region", label: "Region" },
  { key: "province", label: "Province" },
  { key: "assessment_center", label: "Assessment Center" },
  { key: "address", label: "Address" },
  { key: "longitude", label: "Longitude" },
  { key: "latitude", label: "Latitude" },
  { key: "center_manager", label: "Center Manager" },
  { key: "tel_no", label: "Tel. No." },
  { key: "sector", label: "Sector" },
  { key: "qualification_title", label: "Qualification Title" },
  { key: "accreditation_number", label: "Accreditation Number" },
  { key: "date_accredited", label: "Date Accredited" },
  { key: "valid_until", label: "Valid Until" },
];

// ── Accredited Competency Assessors ─────────────────────────────────────────
export const ASSESSOR_COLUMNS: PtcacsColumnDef[] = [
  { key: "region", label: "Region" },
  { key: "province", label: "Province" },
  { key: "name", label: "Name" },
  { key: "address", label: "Address" },
  { key: "sex", label: "Sex" },
  { key: "date_of_birth", label: "Date of Birth" },
  { key: "educational_attainment", label: "Educational Attainment" },
  { key: "present_designation", label: "Present Designation" },
  { key: "company_name", label: "Company Name" },
  { key: "sector", label: "Sector" },
  { key: "qualification_title", label: "Qualification Title" },
  { key: "accreditation_number", label: "Accreditation Number" },
  { key: "date_of_accreditation", label: "Date of Accreditation" },
  { key: "valid_until", label: "Valid Until" },
];

/** A PTCACs record: a stable numeric id, the source sheet, and the snake_case
 *  columns above (string | null). Shared shape for both registries. */
export interface PtcacsRecord {
  id: number;
  source_sheet?: string | null;
  [key: string]: string | number | null | undefined;
}

export const CENTERS_TABLE_NAME = "assessment_centers";
export const ASSESSORS_TABLE_NAME = "competency_assessors";
