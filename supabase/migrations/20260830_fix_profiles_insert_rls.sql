-- ============================================================
-- Emmaüs Connect — Add INSERT RLS policy to profiles table
-- Fix: vacations FK constraint failure due to missing profile row
-- Date: 2026-08-30
-- ============================================================

-- Allow authenticated users to INSERT their own profile row
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
