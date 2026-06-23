-- =====================================================================
-- NTTC Registry — Region VII (TESDA) — PostgreSQL schema
-- Generated from: RO 2026 NTTC REGISTRY - REGION VII - NTTC 2026.csv
-- All source values preserved verbatim as TEXT for a lossless import.
-- =====================================================================

DROP TABLE IF EXISTS nttc_registry CASCADE;

CREATE TABLE nttc_registry (
  id                        INTEGER PRIMARY KEY,
  region                   TEXT,
  province                 TEXT,
  last_name                TEXT,
  first_name               TEXT,
  middle_initial           TEXT,
  extension_name           TEXT,
  birthday                 TEXT,
  sex                      TEXT,
  complete_address         TEXT,
  email_address            TEXT,
  contact_number           TEXT,
  educational_attainment   TEXT,
  training_institution     TEXT,
  institution_type         TEXT,
  years_training           TEXT,
  years_practicing         TEXT,
  sector                   TEXT,
  qualification            TEXT,
  nc_certificate_number    TEXT,
  nc_date_issued           TEXT,
  nc_expiration_date       TEXT,
  tm_certificate_number    TEXT,
  tm_date_issued           TEXT,
  tm_expiration_date       TEXT,
  assessor_panel_1         TEXT,
  assessor_panel_2         TEXT,
  assessor_panel_3         TEXT,
  nttc_certificate_number  TEXT,
  nttc_date_issued         TEXT,
  nttc_expiration_date     TEXT,
  cln_ntc_number           TEXT,
  remarks                  TEXT,
  nttc_type                TEXT,
  employment_type          TEXT,
  employment_status        TEXT,
  expiration_match_nc      TEXT,
  month_issued             TEXT,
  year_issued              TEXT
);

COMMENT ON TABLE nttc_registry IS 'National TVET Trainer''s Certificate (NTTC) holders — TESDA Region VII registry.';
COMMENT ON COLUMN nttc_registry.region IS 'Region (source column A)';
COMMENT ON COLUMN nttc_registry.province IS 'Province (source column B)';
COMMENT ON COLUMN nttc_registry.last_name IS 'Last Name (source column C)';
COMMENT ON COLUMN nttc_registry.first_name IS 'First Name (source column D)';
COMMENT ON COLUMN nttc_registry.middle_initial IS 'Middle Initial (source column E)';
COMMENT ON COLUMN nttc_registry.extension_name IS 'Extension (source column F)';
COMMENT ON COLUMN nttc_registry.birthday IS 'Birthday (source column G)';
COMMENT ON COLUMN nttc_registry.sex IS 'Sex (source column H)';
COMMENT ON COLUMN nttc_registry.complete_address IS 'Complete Address (source column I)';
COMMENT ON COLUMN nttc_registry.email_address IS 'Email Address (source column J)';
COMMENT ON COLUMN nttc_registry.contact_number IS 'Contact Number (source column K)';
COMMENT ON COLUMN nttc_registry.educational_attainment IS 'Educational Attainment (source column L)';
COMMENT ON COLUMN nttc_registry.training_institution IS 'Training Institution / Company (source column M)';
COMMENT ON COLUMN nttc_registry.institution_type IS 'Type of Training Institution (source column N)';
COMMENT ON COLUMN nttc_registry.years_training IS 'Years of Experience (Training) (source column O)';
COMMENT ON COLUMN nttc_registry.years_practicing IS 'Years Practicing the Qualification (source column P)';
COMMENT ON COLUMN nttc_registry.sector IS 'Sector (source column Q)';
COMMENT ON COLUMN nttc_registry.qualification IS 'Qualification (source column R)';
COMMENT ON COLUMN nttc_registry.nc_certificate_number IS 'NC Certificate Number (source column S)';
COMMENT ON COLUMN nttc_registry.nc_date_issued IS 'NC Date Issued (source column T)';
COMMENT ON COLUMN nttc_registry.nc_expiration_date IS 'NC Expiration Date (source column U)';
COMMENT ON COLUMN nttc_registry.tm_certificate_number IS 'TM Certificate Number (source column V)';
COMMENT ON COLUMN nttc_registry.tm_date_issued IS 'TM Date Issued (source column W)';
COMMENT ON COLUMN nttc_registry.tm_expiration_date IS 'TM Expiration Date (source column X)';
COMMENT ON COLUMN nttc_registry.assessor_panel_1 IS 'Assessor (Panel 1) (source column Y)';
COMMENT ON COLUMN nttc_registry.assessor_panel_2 IS 'Assessor (Panel 2) (source column Z)';
COMMENT ON COLUMN nttc_registry.assessor_panel_3 IS 'Assessor (Panel 3) (source column AA)';
COMMENT ON COLUMN nttc_registry.nttc_certificate_number IS 'NTTC Certificate Number (source column AB)';
COMMENT ON COLUMN nttc_registry.nttc_date_issued IS 'NTTC Date Issued (source column AC)';
COMMENT ON COLUMN nttc_registry.nttc_expiration_date IS 'NTTC Expiration Date (Validity) (source column AD)';
COMMENT ON COLUMN nttc_registry.cln_ntc_number IS 'CLN-NTC Number (Control Number) (source column AE)';
COMMENT ON COLUMN nttc_registry.remarks IS 'Remarks (source column AF)';
COMMENT ON COLUMN nttc_registry.nttc_type IS 'New NTTC or Renewal (source column AG)';
COMMENT ON COLUMN nttc_registry.employment_type IS 'Type of Employment (source column AH)';
COMMENT ON COLUMN nttc_registry.employment_status IS 'Status of Employment (source column AI)';
COMMENT ON COLUMN nttc_registry.expiration_match_nc IS 'NTTC Expiration Same as NC (source column AJ)';
COMMENT ON COLUMN nttc_registry.month_issued IS 'Month Issued (source column AK)';
COMMENT ON COLUMN nttc_registry.year_issued IS 'Year Issued (source column AL)';

CREATE INDEX idx_nttc_registry_province     ON nttc_registry (province);
CREATE INDEX idx_nttc_registry_last_name     ON nttc_registry (last_name);
CREATE INDEX idx_nttc_registry_qualification ON nttc_registry (qualification);
CREATE INDEX idx_nttc_registry_cln_ntc       ON nttc_registry (cln_ntc_number);
CREATE INDEX idx_nttc_registry_nttc_cert     ON nttc_registry (nttc_certificate_number);
