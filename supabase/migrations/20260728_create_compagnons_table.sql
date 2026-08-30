-- ============================================================
-- Emmaüs Connect — Compagnons Table Migration (Updated)
-- Creates the compagnons table for companion management (CRUD)
-- Includes role_id for RBAC role assignment
-- Date: 2026-07-28
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. COMPAGNONS TABLE
-- Stores all companion records managed by the platform.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.compagnons (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name  VARCHAR(100) NOT NULL,
  email      VARCHAR(255),
  phone      VARCHAR(30),
  role_id    UUID REFERENCES public.roles (id) ON DELETE SET NULL,
  status     VARCHAR(50) DEFAULT 'actif' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL
);


-- ────────────────────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY (RLS)
-- Only authenticated users can interact with compagnons.
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.compagnons ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can SELECT all compagnons
CREATE POLICY "Authenticated users can view compagnons"
  ON public.compagnons
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: authenticated users can INSERT compagnons
CREATE POLICY "Authenticated users can create compagnons"
  ON public.compagnons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: authenticated users can UPDATE compagnons
CREATE POLICY "Authenticated users can update compagnons"
  ON public.compagnons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: authenticated users can DELETE compagnons
CREATE POLICY "Authenticated users can delete compagnons"
  ON public.compagnons
  FOR DELETE
  TO authenticated
  USING (true);
