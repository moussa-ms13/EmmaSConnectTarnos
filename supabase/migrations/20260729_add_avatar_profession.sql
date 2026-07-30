-- ============================================================
-- Emmaüs Connect — Add avatar_url & profession to compagnons
-- Includes storage policies for 'avatars' bucket
-- Date: 2026-07-29
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ADD COLUMNS TO COMPAGNONS TABLE
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.compagnons
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS profession VARCHAR(150);

-- ────────────────────────────────────────────────────────────
-- 2. STORAGE POLICIES FOR 'avatars' BUCKET
-- Note: 'avatars' bucket is created as a public storage bucket.
-- ────────────────────────────────────────────────────────────
-- Allow public SELECT on avatars bucket
CREATE POLICY "Public access to avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update avatars
CREATE POLICY "Authenticated users can update avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to delete avatars
CREATE POLICY "Authenticated users can delete avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');
