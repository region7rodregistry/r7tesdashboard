-- =====================================================================
-- PTCACs — Region VII (TESDA) — PostgreSQL / Supabase schema
-- Two read-only public registries:
--   • assessment_centers    — Accredited Competency Assessment Centers
--   • competency_assessors   — Accredited Competency Assessors
-- Source: "5. Registry of Accredited Compentency Assessment Center …xlsx"
--         "5. Registry of Accredited Compentency Assessors …xlsx"
-- All source values preserved verbatim as TEXT for a lossless import;
-- the date_* / valid_until columns are normalized to ISO (YYYY-MM-DD).
-- Run this first, then db/assessment_centers_seed.sql + db/assessors_seed.sql.
-- =====================================================================

-- ---------------------------------------------------------------------------
-- Accredited Competency Assessment Centers
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS assessment_centers CASCADE;

CREATE TABLE assessment_centers (
  id                    INTEGER PRIMARY KEY,
  source_sheet          TEXT,
  region                TEXT,
  province              TEXT,
  assessment_center     TEXT,
  address               TEXT,
  longitude             TEXT,
  latitude              TEXT,
  center_manager        TEXT,
  tel_no                TEXT,
  sector                TEXT,
  qualification_title   TEXT,
  accreditation_number  TEXT,
  date_accredited       TEXT,
  valid_until           TEXT
);

COMMENT ON TABLE assessment_centers IS 'TESDA Region VII — Accredited Competency Assessment Centers (one row per accredited qualification).';

CREATE INDEX idx_ac_province       ON assessment_centers (province);
CREATE INDEX idx_ac_center         ON assessment_centers (assessment_center);
CREATE INDEX idx_ac_sector         ON assessment_centers (sector);
CREATE INDEX idx_ac_qualification  ON assessment_centers (qualification_title);
CREATE INDEX idx_ac_accreditation  ON assessment_centers (accreditation_number);

ALTER TABLE assessment_centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON assessment_centers;
CREATE POLICY "Public read access" ON assessment_centers
  FOR SELECT TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- Accredited Competency Assessors
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS competency_assessors CASCADE;

CREATE TABLE competency_assessors (
  id                      INTEGER PRIMARY KEY,
  source_sheet            TEXT,
  region                  TEXT,
  province                TEXT,
  name                    TEXT,
  address                 TEXT,
  sex                     TEXT,
  date_of_birth           TEXT,
  educational_attainment  TEXT,
  present_designation      TEXT,
  company_name            TEXT,
  sector                  TEXT,
  qualification_title     TEXT,
  accreditation_number    TEXT,
  date_of_accreditation   TEXT,
  valid_until             TEXT
);

COMMENT ON TABLE competency_assessors IS 'TESDA Region VII — Accredited Competency Assessors (one row per accredited qualification).';

CREATE INDEX idx_ca_province       ON competency_assessors (province);
CREATE INDEX idx_ca_name           ON competency_assessors (name);
CREATE INDEX idx_ca_sector         ON competency_assessors (sector);
CREATE INDEX idx_ca_qualification  ON competency_assessors (qualification_title);
CREATE INDEX idx_ca_accreditation  ON competency_assessors (accreditation_number);

ALTER TABLE competency_assessors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON competency_assessors;
CREATE POLICY "Public read access" ON competency_assessors
  FOR SELECT TO anon, authenticated USING (true);
