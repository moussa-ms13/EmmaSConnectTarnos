-- ============================================================
-- Emmaüs Connect — Fix vacations compagnon_id constraint
-- Make compagnon_id optional so standard users can request vacations
-- Date: 2026-07-29
-- ============================================================

ALTER TABLE public.vacations ALTER COLUMN compagnon_id DROP NOT NULL;
