-- ============================================================
-- Emmaüs Connect — Add requested_by to vacations table
-- Links vacation requests to the authenticated user (profiles)
-- Date: 2026-07-29
-- ============================================================

ALTER TABLE public.vacations
  ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL;
