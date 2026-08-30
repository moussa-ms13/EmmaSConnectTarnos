-- ============================================================
-- Emmaüs Connect — Add updated_at to vacations and appointments
-- Date: 2026-08-09
-- ============================================================

-- Add updated_at to vacations
ALTER TABLE public.vacations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;

DROP TRIGGER IF EXISTS vacations_updated_at ON public.vacations;
CREATE TRIGGER vacations_updated_at
  BEFORE UPDATE ON public.vacations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add updated_at to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;

DROP TRIGGER IF EXISTS appointments_updated_at ON public.appointments;
CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
