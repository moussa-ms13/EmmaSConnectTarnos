-- ============================================================================
-- Migration: Fix Documents Delete RLS Policies
-- Date: 2026-07-29
-- Description: Ensures authenticated users can DELETE rows from the documents
-- table and remove files from the 'documents' Supabase storage bucket.
-- ============================================================================

-- 1. Ensure RLS is enabled on public.documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing delete policy if any, then create clean DELETE policy for documents table
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON public.documents;

CREATE POLICY "Authenticated users can delete documents"
  ON public.documents
  FOR DELETE
  TO authenticated
  USING (true);

-- Ensure authenticated users can also SELECT, INSERT, and UPDATE documents rows
DROP POLICY IF EXISTS "Authenticated users can select documents" ON public.documents;
CREATE POLICY "Authenticated users can select documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert documents" ON public.documents;
CREATE POLICY "Authenticated users can insert documents"
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update documents" ON public.documents;
CREATE POLICY "Authenticated users can update documents"
  ON public.documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Ensure 'documents' bucket exists in storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Drop existing delete policy on storage.objects for 'documents' bucket if any, then create clean DELETE policy
DROP POLICY IF EXISTS "Allow authenticated delete documents bucket" ON storage.objects;

CREATE POLICY "Allow authenticated delete documents bucket"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');

-- Ensure authenticated users can also SELECT, INSERT, and UPDATE files in the 'documents' bucket
DROP POLICY IF EXISTS "Allow authenticated select documents bucket" ON storage.objects;
CREATE POLICY "Allow authenticated select documents bucket"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow authenticated insert documents bucket" ON storage.objects;
CREATE POLICY "Allow authenticated insert documents bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow authenticated update documents bucket" ON storage.objects;
CREATE POLICY "Allow authenticated update documents bucket"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents');
