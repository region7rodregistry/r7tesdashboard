-- =====================================================================
-- UTPRAS Registry -- Region VII (TESDA) -- PostgreSQL / Supabase schema
-- Source: "Compendium of Registered Programs as of May 2026.xlsx"
--   sheets: 2026 Bohol, 2026 Cebu, 2026 Negros Oriental, 2026 Siquijor
-- All source values preserved verbatim as TEXT for a lossless import.
-- Columns are aligned BY HEADER NAME across sheets: the Bohol sheet omits
-- "Expiration Date of NTTC", so utpras_registry.nttc_expiration_date is NULL
-- for every Bohol row.
-- =====================================================================

DROP TABLE IF EXISTS utpras_registry CASCADE;

CREATE TABLE utpras_registry (
  id                              INTEGER PRIMARY KEY,
  source_sheet                    TEXT,
  region                          TEXT,
  province                        TEXT,
  congressional_district          TEXT,
  municipality                    TEXT,
  municipality_class              TEXT,
  unique_institution_id           TEXT,
  institution_name                TEXT,
  formerly_name                   TEXT,
  institution_head                TEXT,
  address                         TEXT,
  latitude                        TEXT,
  longitude                       TEXT,
  tel_no                          TEXT,
  email                           TEXT,
  institution_type                TEXT,
  classification                  TEXT,
  status                          TEXT,
  sector                          TEXT,
  course_program                  TEXT,
  pqf_level                       TEXT,
  duration                        TEXT,
  program_reg_no                  TEXT,
  date_issued                     TEXT,
  expiration_date                 TEXT,
  trainer                         TEXT,
  nttc                            TEXT,
  nttc_expiration_date            TEXT,
  date_conducted                  TEXT,
  result                          TEXT,
  original_date_of_registration   TEXT
);

COMMENT ON TABLE utpras_registry IS 'UTPRAS registered/accredited TVET programs -- TESDA Region VII (Bohol, Cebu, Negros Oriental, Siquijor), as of May 2026.';

CREATE INDEX idx_utpras_province        ON utpras_registry (province);
CREATE INDEX idx_utpras_institution     ON utpras_registry (institution_name);
CREATE INDEX idx_utpras_sector          ON utpras_registry (sector);
CREATE INDEX idx_utpras_program_reg_no  ON utpras_registry (program_reg_no);
CREATE INDEX idx_utpras_uiid            ON utpras_registry (unique_institution_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: public, read-only registry. anon/authenticated may
-- SELECT; writes stay locked to the service-role key (bypasses RLS).
-- ---------------------------------------------------------------------------
ALTER TABLE utpras_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON utpras_registry;
CREATE POLICY "Public read access" ON utpras_registry
  FOR SELECT
  TO anon, authenticated
  USING (true);
