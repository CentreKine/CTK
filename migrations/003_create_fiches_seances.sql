-- Migration: create fiches_seances table
CREATE TABLE IF NOT EXISTS fiches_seances (
  id TEXT PRIMARY KEY,
  fiche_id TEXT REFERENCES fiches_suivi(id) ON DELETE CASCADE,
  date DATE,
  traitement TEXT,
  observation TEXT,
  visa_kine TEXT,
  visa_patient TEXT,
  created_by TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
