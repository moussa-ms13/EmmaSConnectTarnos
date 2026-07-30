-- ============================================================
-- Emmaüs Connect — Initialize Health Module (Santé)
-- Ensures medical_records and consultations have all required columns
-- Date: 2026-07-29
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. MEDICAL RECORDS TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compagnon_id UUID REFERENCES public.compagnons(id) ON DELETE CASCADE UNIQUE,
  blood_type VARCHAR(10),
  doctor_name VARCHAR(150),
  pathologies TEXT[],
  allergies TEXT[],
  health_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS health_summary TEXT;

-- ────────────────────────────────────────────────────────────
-- 2. CONSULTATIONS TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compagnon_id UUID REFERENCES public.compagnons(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE,
  doctor_name VARCHAR(150),
  specialty VARCHAR(150),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'Terminé',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can access medical_records"
    ON public.medical_records FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can access consultations"
    ON public.consultations FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
