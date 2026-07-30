-- ============================================================
-- Emmaüs Connect — Consolidated Schema Update
-- Adds address fields, consultations table, and vacations table
-- Date: 2026-07-29
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. EXTEND COMPAGNONS TABLE — Contact details
-- (email and phone already exist from initial migration)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.compagnons
  ADD COLUMN IF NOT EXISTS address     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);

-- ────────────────────────────────────────────────────────────
-- 2. CONSULTATIONS TABLE — Medical consultations history
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consultations (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compagnon_id UUID NOT NULL REFERENCES public.compagnons (id) ON DELETE CASCADE,
  date         TIMESTAMPTZ DEFAULT now() NOT NULL,
  doctor_name  VARCHAR(150),
  specialty    VARCHAR(100),
  notes        TEXT,
  status       VARCHAR(50) DEFAULT 'Terminé' NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view consultations"
  ON public.consultations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create consultations"
  ON public.consultations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update consultations"
  ON public.consultations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete consultations"
  ON public.consultations FOR DELETE TO authenticated USING (true);

-- ────────────────────────────────────────────────────────────
-- 3. VACATIONS TABLE — Companion absences (Congés)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vacations (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compagnon_id UUID NOT NULL REFERENCES public.compagnons (id) ON DELETE CASCADE,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  reason       VARCHAR(255),
  status       VARCHAR(50) DEFAULT 'En attente' NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vacations"
  ON public.vacations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create vacations"
  ON public.vacations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update vacations"
  ON public.vacations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vacations"
  ON public.vacations FOR DELETE TO authenticated USING (true);
