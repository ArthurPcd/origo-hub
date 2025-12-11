-- ============================================================================
-- ORIGO Security: Private Logo Storage with RLS
-- Migration 002: Secure brief-logos bucket
-- ============================================================================
-- Created: 2026-02-16
-- Description: Make logo storage PRIVATE with RLS policies for user isolation
-- CRITICAL: Logos may contain confidential client information under NDA
-- ============================================================================

-- IMPORTANT: This migration requires manual bucket configuration in Supabase Dashboard
-- 
-- STEP 1: Configure bucket (Supabase Dashboard > Storage)
-- -------------------------------------------------------
-- Bucket name: brief-logos
-- Public: NO (MUST BE PRIVATE)
-- File size limit: 2MB
-- Allowed MIME types: image/png, image/jpeg, image/svg+xml
--
-- STEP 2: Run this SQL migration to create RLS policies
-- -------------------------------------------------------

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS POLICIES for brief-logos bucket
-- ─────────────────────────────────────────────────────────────────────────────

-- Policy 1: Users can INSERT (upload) to their own folder only
-- Pattern: {user_id}/filename.ext
DROP POLICY IF EXISTS "Users upload own logos" ON storage.objects;
CREATE POLICY "Users upload own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brief-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can UPDATE their own logos only
DROP POLICY IF EXISTS "Users update own logos" ON storage.objects;
CREATE POLICY "Users update own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brief-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can DELETE their own logos only
DROP POLICY IF EXISTS "Users delete own logos" ON storage.objects;
CREATE POLICY "Users delete own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'brief-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Users can SELECT (read) their own logos only
-- IMPORTANT: This does NOT make files publicly accessible
-- Files are accessed via signed URLs with expiration (generated server-side)
DROP POLICY IF EXISTS "Users read own logos" ON storage.objects;
CREATE POLICY "Users read own logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'brief-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Check RLS is enabled on storage.objects
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';
-- Expected: rowsecurity = true

-- Check policies exist
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%logo%';
-- Expected: 4 policies (INSERT, UPDATE, DELETE, SELECT)

-- ─────────────────────────────────────────────────────────────────────────────
-- TESTING CHECKLIST
-- ─────────────────────────────────────────────────────────────────────────────
--
-- 1. Create 2 test users (user A, user B)
-- 2. User A uploads logo → should succeed to folder A
-- 3. User A tries to read logo from folder A → should succeed via signed URL
-- 4. User B tries to read logo from folder A → should FAIL (403)
-- 5. User B uploads logo → should succeed to folder B
-- 6. Verify public access is blocked (direct URL without signature = 403)
--
-- ─────────────────────────────────────────────────────────────────────────────

