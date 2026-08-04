-- ============================================================
-- Emmaüs Connect — Profile Tab Tables: documents, formations, skills
-- Date: 2026-08-04
-- Description: Creates three new tables that back the CompanionProfile
--              tabbed UI. All tables use RLS: Viewers can read/write
--              only their own rows; Admins/Editors have full access.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. DOCUMENTS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compagnon_id   UUID NOT NULL REFERENCES public.compagnons(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  status         VARCHAR(30) DEFAULT 'valide' NOT NULL
                 CHECK (status IN ('valide', 'a_renouveler', 'manquant')),
  expiry_date    DATE,
  file_url       TEXT,
  file_name      TEXT,
  icon           TEXT DEFAULT '📄',
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_compagnon_id ON public.documents(compagnon_id);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and editors manage all documents" ON public.documents;
DROP POLICY IF EXISTS "Viewers read their own documents"        ON public.documents;

-- Staff: full access
CREATE POLICY "Admins and editors manage all documents"
  ON public.documents
  FOR ALL
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.compagnons c
      WHERE c.user_id = auth.uid()
        AND lower(c.role) IN ('viewer', 'lecteur', 'read', 'compagnon')
    )
  )
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.compagnons c
      WHERE c.user_id = auth.uid()
        AND lower(c.role) IN ('viewer', 'lecteur', 'read', 'compagnon')
    )
  );

-- Viewers: read only their own documents
CREATE POLICY "Viewers read their own documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.compagnons c
      WHERE c.user_id = auth.uid()
        AND c.id = documents.compagnon_id
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 2. FORMATIONS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.formations (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compagnon_id   UUID NOT NULL REFERENCES public.compagnons(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  location       TEXT,
  status         VARCHAR(30) DEFAULT 'planifié' NOT NULL
                 CHECK (status IN ('obtenu', 'en_cours', 'planifié')),
  progress       INTEGER DEFAULT 0 NOT NULL CHECK (progress BETWEEN 0 AND 100),
  start_date     DATE,
  end_date       DATE,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_formations_compagnon_id ON public.formations(compagnon_id);

ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and editors manage all formations" ON public.formations;
DROP POLICY IF EXISTS "Viewers read their own formations"        ON public.formations;

CREATE POLICY "Admins and editors manage all formations"
  ON public.formations
  FOR ALL
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.compagnons c
      WHERE c.user_id = auth.uid()
        AND lower(c.role) IN ('viewer', 'lecteur', 'read', 'compagnon')
    )
  )
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.compagnons c
      WHERE c.user_id = auth.uid()
        AND lower(c.role) IN ('viewer', 'lecteur', 'read', 'compagnon')
    )
  );

CREATE POLICY "Viewers read their own formations"
  ON public.formations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.compagnons c
      WHERE c.user_id = auth.uid()
        AND c.id = formations.compagnon_id
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 3. SKILLS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.skills (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compagnon_id   UUID NOT NULL REFERENCES public.compagnons(id) ON DELETE CASCADE,
  category       VARCHAR(50) NOT NULL
                 CHECK (category IN ('techniques', 'soft', 'languages', 'digital')),
  name           TEXT NOT NULL,
  progress       INTEGER DEFAULT 0 NOT NULL CHECK (progress BETWEEN 0 AND 100),
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_skills_compagnon_id ON public.skills(compagnon_id);
CREATE INDEX IF NOT EXISTS idx_skills_category     ON public.skills(category);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and editors manage all skills" ON public.skills;
DROP POLICY IF EXISTS "Viewers read their own skills"        ON public.skills;

CREATE POLICY "Admins and editors manage all skills"
  ON public.skills
  FOR ALL
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.compagnons c
      WHERE c.user_id = auth.uid()
        AND lower(c.role) IN ('viewer', 'lecteur', 'read', 'compagnon')
    )
  )
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.compagnons c
      WHERE c.user_id = auth.uid()
        AND lower(c.role) IN ('viewer', 'lecteur', 'read', 'compagnon')
    )
  );

CREATE POLICY "Viewers read their own skills"
  ON public.skills
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.compagnons c
      WHERE c.user_id = auth.uid()
        AND c.id = skills.compagnon_id
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 4. STORAGE BUCKET: documents
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow staff to upload documents
DROP POLICY IF EXISTS "Staff can upload documents" ON storage.objects;
CREATE POLICY "Staff can upload documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND NOT EXISTS (
      SELECT 1 FROM public.compagnons c
      WHERE c.user_id = auth.uid()
        AND lower(c.role) IN ('viewer', 'lecteur', 'read', 'compagnon')
    )
  );

-- Allow reading documents for authenticated users
DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
CREATE POLICY "Authenticated users can read documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

-- ─────────────────────────────────────────────────────────────
-- 5. AUTO-UPDATE updated_at TRIGGERS
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS documents_updated_at  ON public.documents;
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS formations_updated_at ON public.formations;
CREATE TRIGGER formations_updated_at
  BEFORE UPDATE ON public.formations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS skills_updated_at     ON public.skills;
CREATE TRIGGER skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
