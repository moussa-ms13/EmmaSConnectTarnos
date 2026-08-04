-- ============================================================
-- Emmaüs Connect — Avatars Storage Bucket Configuration
-- Date: 2026-08-04
-- Description: Creates the 'avatars' storage bucket with proper
--              RLS policies for authenticated users to upload
--              and read avatar images for Compagnons.
-- ============================================================

-- 1. CREATE THE AVATARS BUCKET (if it does not already exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,       -- public bucket so images are accessible via URL
  2097152,    -- 2 MB max file size
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- 2. DROP EXISTING POLICIES SAFELY
DROP POLICY IF EXISTS "Authenticated users can upload avatars"  ON storage.objects;
DROP POLICY IF EXISTS "Public users can view avatars"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatars" ON storage.objects;

-- 3. POLICY: Authenticated users can INSERT (upload) to the avatars bucket
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- 4. POLICY: Anyone (public) can view/download avatars (since bucket is public)
CREATE POLICY "Public users can view avatars"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- 5. POLICY: Authenticated users can UPDATE (overwrite) avatars
CREATE POLICY "Authenticated users can update avatars"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

-- 6. POLICY: Authenticated users can DELETE avatars
CREATE POLICY "Authenticated users can delete avatars"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');
