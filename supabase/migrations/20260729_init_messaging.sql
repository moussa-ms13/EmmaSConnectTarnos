-- ============================================================================
-- Migration: Initialize Messages & Notifications Table
-- Date: 2026-07-29
-- Description: Creates the communications layer for notifications and messaging
-- between staff and companions with full RLS protection.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id   UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT false NOT NULL,
  type        VARCHAR(20) DEFAULT 'message' NOT NULL, -- 'message' or 'alert'
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;

-- RLS: Users can view messages where they are sender_id or receiver_id
CREATE POLICY "Users can view their own messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- RLS: Users can insert messages where sender_id is auth.uid()
CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- RLS: Users can update messages (e.g. mark as read) where they are receiver_id
CREATE POLICY "Users can update their received messages"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);
