-- ============================================================================
-- Migration: Initialize Final Modules (Formations, Documents, Réalisations)
-- Date: 2026-07-29
-- Description: Creates tables for Formations, Documents (with Storage policies),
-- and Réalisations (Achievements), enabling RLS for authenticated access.
-- ============================================================================

-- 1. FORMATIONS TABLE
CREATE TABLE IF NOT EXISTS public.formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  duration_hours INTEGER DEFAULT 0,
  participants_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can access formations"
    ON public.formations FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. COMPAGNON_FORMATIONS TABLE (Junction & Progress)
CREATE TABLE IF NOT EXISTS public.compagnon_formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compagnon_id UUID REFERENCES public.compagnons(id) ON DELETE CASCADE NOT NULL,
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE NOT NULL,
  progress_percentage INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'À commencer', -- En cours, Terminé, À commencer
  completed_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.compagnon_formations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can access compagnon_formations"
    ON public.compagnon_formations FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compagnon_id UUID REFERENCES public.compagnons(id) ON DELETE CASCADE NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) DEFAULT 'Identité', -- Identité, Médical, Administratif, Formation, Autre
  file_size INTEGER DEFAULT 0,
  expiration_date DATE,
  status VARCHAR(50) DEFAULT 'Valide', -- Valide, À renouveler, Expiré
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can access documents"
    ON public.documents FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4. ACHIEVEMENTS TABLE (Réalisations)
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compagnon_id UUID REFERENCES public.compagnons(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'Excellence', -- Excellence, Engagement, Formation, Innovation
  badge_level VARCHAR(50) DEFAULT 'Or', -- Or, Argent, Bronze, Certificat, Expert, Spécial
  date_awarded DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can access achievements"
    ON public.achievements FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 5. STORAGE BUCKET & RLS POLICIES FOR 'documents'
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Allow authenticated read documents bucket"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'documents');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow authenticated insert documents bucket"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'documents');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow authenticated update documents bucket"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'documents');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow authenticated delete documents bucket"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'documents');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
