-- ============================================================
-- Emmaüs Connect — Companion Profile Schema Expansion
-- Adds profile fields to compagnons + medical_records table
-- Date: 2026-07-28
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. EXTEND COMPAGNONS TABLE
-- Add profile-level columns for detailed companion view.
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.compagnons
  ADD COLUMN IF NOT EXISTS gender        VARCHAR(20),
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS city          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS join_date     DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS referent_id   UUID REFERENCES public.profiles (id) ON DELETE SET NULL;

-- ────────────────────────────────────────────────────────────
-- 2. MEDICAL RECORDS TABLE
-- Stores medical information linked 1-to-1 with a companion.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.medical_records (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compagnon_id  UUID NOT NULL REFERENCES public.compagnons (id) ON DELETE CASCADE,
  blood_type    VARCHAR(10),
  doctor_name   VARCHAR(150),
  allergies     TEXT,
  pathologies   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY — medical_records
-- Only authenticated users can interact with medical records.
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view medical records"
  ON public.medical_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create medical records"
  ON public.medical_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update medical records"
  ON public.medical_records
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete medical records"
  ON public.medical_records
  FOR DELETE
  TO authenticated
  USING (true);
