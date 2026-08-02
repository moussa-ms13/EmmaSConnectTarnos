-- ============================================================
-- Emmaüs Connect — Add Auth User & Role to Compagnons
-- Unifies 'Users' and 'Compagnons' so Compagnon is the core entity
-- Date: 2026-08-02
-- ============================================================

-- 1. ADD COLUMNS TO COMPAGNONS TABLE
ALTER TABLE public.compagnons
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Viewer' NOT NULL;

-- 2. CREATE INDEX ON user_id FOR AUTH RESOLUTION
CREATE INDEX IF NOT EXISTS idx_compagnons_user_id ON public.compagnons(user_id);
CREATE INDEX IF NOT EXISTS idx_compagnons_email ON public.compagnons(email);

-- 3. UPDATE RLS POLICIES IF NEEDED
-- Ensure authenticated users can read and write compagnons with user_id and role
ALTER TABLE public.compagnons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can access all compagnons"
    ON public.compagnons
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
