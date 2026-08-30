-- ============================================================
-- Emmaüs Connect — Add sender_name to messages table
-- Stores sender display name for notification rendering
-- Date: 2026-08-30
-- ============================================================

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender_name TEXT;
