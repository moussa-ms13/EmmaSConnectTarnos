-- ============================================================
-- Emmaüs Connect — Create Notifications Table with RLS
-- Date: 2026-08-30
-- Description: Table for in-app notifications and alerts dispatched
-- to specific users or companions.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  receiver_id UUID,
  sender_id UUID,
  type VARCHAR(50) DEFAULT 'message' NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can insert notifications for any user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Authenticated users can insert notifications'
  ) THEN
    CREATE POLICY "Authenticated users can insert notifications"
      ON public.notifications
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Policy 2: Users can select/view their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications"
      ON public.notifications
      FOR SELECT
      TO authenticated
      USING (
        auth.uid() = user_id OR
        auth.uid() = receiver_id OR
        auth.uid() = sender_id
      );
  END IF;
END $$;

-- Policy 3: Users can update (mark as read) their own received notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update their received notifications'
  ) THEN
    CREATE POLICY "Users can update their received notifications"
      ON public.notifications
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id OR auth.uid() = receiver_id)
      WITH CHECK (auth.uid() = user_id OR auth.uid() = receiver_id);
  END IF;
END $$;

-- Policy 4: Users can delete their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can delete their own notifications'
  ) THEN
    CREATE POLICY "Users can delete their own notifications"
      ON public.notifications
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id OR auth.uid() = receiver_id);
  END IF;
END $$;
