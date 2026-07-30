-- ============================================================
-- Emmaüs Connect — Core RBAC Schema Migration
-- Creates roles and profiles tables with Row Level Security
-- Date: 2026-07-28
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ROLES TABLE
-- Stores the application-level roles for RBAC.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
  id   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- Seed default roles
INSERT INTO public.roles (name) VALUES
  ('admin'),
  ('user'),
  ('read')
ON CONFLICT (name) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 2. PROFILES TABLE
-- Each row maps 1-to-1 with a Supabase auth.users entry.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role_id    UUID REFERENCES public.roles (id) ON DELETE SET NULL,
  first_name VARCHAR(100),
  last_name  VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY (RLS)
-- Users can only read and update their own profile row.
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: users can SELECT their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: users can UPDATE their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
