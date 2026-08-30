-- ============================================================
-- Emmaüs Connect — Fix profiles RLS policies
-- 1. Allow users to INSERT their own profile row (FK fix)
-- 2. Allow admins to SELECT all profiles (requester names, recipients)
-- Date: 2026-08-30
-- ============================================================

-- Allow authenticated users to INSERT their own profile row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON public.profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Allow all authenticated users to SELECT all profiles
-- (needed for admin to see requester names, messaging recipients, etc.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Authenticated users can view all profiles'
  ) THEN
    -- Drop the restrictive self-only SELECT policy
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    
    CREATE POLICY "Authenticated users can view all profiles"
      ON public.profiles
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;
