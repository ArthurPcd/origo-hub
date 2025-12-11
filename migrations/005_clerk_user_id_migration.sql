-- ============================================================================
-- ORIGO Migration 005: Supabase Auth UUID → Clerk String IDs
-- ============================================================================
-- Created: 2026-02-19
-- Description: Migrates user_id columns from UUID (Supabase Auth) to TEXT
--              (Clerk IDs like "user_2abc123xyz"). Updates all RLS policies
--              to use (auth.jwt() ->> 'sub') instead of auth.uid().
--              Updates atomic functions signatures from UUID to TEXT.
--
-- ⚠️  REFERENCE / DOCUMENTATION FILE — DO NOT PUSH TO PROD AUTOMATICALLY
--     This file contains the full destructive migration including column
--     rename with data preservation. Run manually after verifying backups.
--
-- PREREQUISITE: Clerk JWT template must include { "sub": "<clerk_user_id>" }
--               and be configured in Supabase Dashboard > Auth > JWT Settings.
--
-- EXECUTION ORDER:
--   1. Backup the database
--   2. Run this file in a transaction
--   3. Verify row counts on each table
--   4. Update application code to pass Clerk user IDs
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: briefs
-- ============================================================================

-- 1a. Add temporary column for Clerk ID
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- 1b. Drop FK constraint referencing auth.users
--     (constraint name follows Supabase default pattern)
ALTER TABLE briefs DROP CONSTRAINT IF EXISTS briefs_user_id_fkey;

-- 1c. Rename existing UUID column to preserve historical data
ALTER TABLE briefs RENAME COLUMN user_id TO supabase_user_id;

-- 1d. Promote clerk_user_id to user_id
ALTER TABLE briefs RENAME COLUMN clerk_user_id TO user_id;

-- 1e. Add NOT NULL constraint (fill must happen before this in a real migration)
--     NOTE: In production, populate user_id before applying NOT NULL:
--       UPDATE briefs SET user_id = <mapping> WHERE user_id IS NULL;
ALTER TABLE briefs ALTER COLUMN user_id SET NOT NULL;

-- 1f. Recreate index
DROP INDEX IF EXISTS idx_briefs_user_id;
CREATE INDEX idx_briefs_user_id ON briefs(user_id);

-- 1g. Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own briefs" ON briefs;
DROP POLICY IF EXISTS "Users can insert own briefs" ON briefs;
DROP POLICY IF EXISTS "Users can delete own briefs" ON briefs;
DROP POLICY IF EXISTS "Service role has full access to briefs" ON briefs;

-- 1h. Create new RLS policies using Clerk JWT sub
CREATE POLICY "Users can view own briefs"
  ON briefs FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can insert own briefs"
  ON briefs FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can update own briefs"
  ON briefs FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can delete own briefs"
  ON briefs FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Service role has full access to briefs"
  ON briefs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 2: user_subscriptions
-- ============================================================================

ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;

ALTER TABLE user_subscriptions RENAME COLUMN user_id TO supabase_user_id;
ALTER TABLE user_subscriptions RENAME COLUMN clerk_user_id TO user_id;

-- NOTE: populate user_id from supabase_user_id mapping before setting NOT NULL
ALTER TABLE user_subscriptions ALTER COLUMN user_id SET NOT NULL;

-- Preserve UNIQUE constraint on user_id
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_key;
ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);

DROP INDEX IF EXISTS idx_user_subscriptions_user_id;
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Service role has full access to subscriptions" ON user_subscriptions;

-- New RLS policies
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Service role has full access to subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 3: brief_folders
-- ============================================================================

ALTER TABLE brief_folders ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

ALTER TABLE brief_folders DROP CONSTRAINT IF EXISTS brief_folders_user_id_fkey;

ALTER TABLE brief_folders RENAME COLUMN user_id TO supabase_user_id;
ALTER TABLE brief_folders RENAME COLUMN clerk_user_id TO user_id;

-- NOTE: populate user_id before setting NOT NULL
ALTER TABLE brief_folders ALTER COLUMN user_id SET NOT NULL;

-- Re-create unique constraint that referenced user_id
ALTER TABLE brief_folders DROP CONSTRAINT IF EXISTS unique_user_folder_name;
ALTER TABLE brief_folders ADD CONSTRAINT unique_user_folder_name UNIQUE (user_id, name);

DROP INDEX IF EXISTS idx_brief_folders_user_id;
DROP INDEX IF EXISTS idx_brief_folders_position;
CREATE INDEX idx_brief_folders_user_id ON brief_folders(user_id);
CREATE INDEX idx_brief_folders_position ON brief_folders(user_id, position);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users manage own folders" ON brief_folders;

-- New RLS policy
CREATE POLICY "Users manage own folders"
  ON brief_folders FOR ALL
  USING ((auth.jwt() ->> 'sub') = user_id);

-- ============================================================================
-- STEP 4: user_feature_activations
-- ============================================================================

ALTER TABLE user_feature_activations ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

ALTER TABLE user_feature_activations DROP CONSTRAINT IF EXISTS user_feature_activations_user_id_fkey;

ALTER TABLE user_feature_activations RENAME COLUMN user_id TO supabase_user_id;
ALTER TABLE user_feature_activations RENAME COLUMN clerk_user_id TO user_id;

-- NOTE: populate user_id before setting NOT NULL
ALTER TABLE user_feature_activations ALTER COLUMN user_id SET NOT NULL;

-- Re-create unique constraint
ALTER TABLE user_feature_activations DROP CONSTRAINT IF EXISTS unique_user_feature;
ALTER TABLE user_feature_activations ADD CONSTRAINT unique_user_feature UNIQUE (user_id, feature_code);

DROP INDEX IF EXISTS idx_user_feature_user;
CREATE INDEX idx_user_feature_user ON user_feature_activations(user_id);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users view own activations" ON user_feature_activations;

-- New RLS policy
CREATE POLICY "Users view own activations"
  ON user_feature_activations FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

-- ============================================================================
-- STEP 5: Atomic functions — UUID → TEXT
-- ============================================================================

-- increment_brief_count
CREATE OR REPLACE FUNCTION increment_brief_count(
  p_user_id TEXT,
  p_limit   INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current INT;
  v_new     INT;
BEGIN
  SELECT brief_count INTO v_current
  FROM user_subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  IF p_limit != -1 AND v_current >= p_limit THEN
    RETURN -2;
  END IF;

  v_new := v_current + 1;

  UPDATE user_subscriptions
  SET brief_count = v_new
  WHERE user_id = p_user_id;

  RETURN v_new;
END;
$$;

REVOKE ALL ON FUNCTION increment_brief_count FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_brief_count TO authenticated;

-- add_credits_atomic
CREATE OR REPLACE FUNCTION add_credits_atomic(
  p_user_id TEXT,
  p_credits INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_subscriptions
  SET brief_count = brief_count + p_credits
  WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION add_credits_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION add_credits_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION add_credits_atomic TO service_role;

-- consume_credits_atomic
CREATE OR REPLACE FUNCTION consume_credits_atomic(
  p_user_id TEXT,
  p_amount  INT,
  p_limit   INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current INT;
  v_new     INT;
BEGIN
  SELECT brief_count INTO v_current
  FROM user_subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  IF p_limit != -1 AND (v_current + p_amount) > p_limit THEN
    RETURN -2;
  END IF;

  v_new := v_current + p_amount;

  UPDATE user_subscriptions
  SET brief_count = v_new
  WHERE user_id = p_user_id;

  RETURN v_new;
END;
$$;

REVOKE ALL ON FUNCTION consume_credits_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_credits_atomic TO authenticated;

-- ============================================================================
-- STEP 6: Storage policies — brief-logos bucket
-- ============================================================================
-- Replace auth.uid()::text with (auth.jwt() ->> 'sub') so the folder name
-- matches the Clerk user ID stored at the path root.

-- INSERT
DROP POLICY IF EXISTS "Users upload own logos" ON storage.objects;
CREATE POLICY "Users upload own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brief-logos'
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
);

-- UPDATE
DROP POLICY IF EXISTS "Users update own logos" ON storage.objects;
CREATE POLICY "Users update own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brief-logos'
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
);

-- DELETE
DROP POLICY IF EXISTS "Users delete own logos" ON storage.objects;
CREATE POLICY "Users delete own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'brief-logos'
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
);

-- SELECT
DROP POLICY IF EXISTS "Users read own logos" ON storage.objects;
CREATE POLICY "Users read own logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'brief-logos'
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
);

-- ============================================================================
-- STEP 7: Update helper functions that accept UUID parameters
-- ============================================================================

CREATE OR REPLACE FUNCTION user_has_feature(p_user_id TEXT, p_feature_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM user_feature_activations
  WHERE user_id = p_user_id
    AND feature_code = p_feature_code
    AND (expires_at IS NULL OR expires_at > NOW());

  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_brief_count and reset_brief_count (from schema.sql)
CREATE OR REPLACE FUNCTION get_brief_count(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COALESCE(brief_count, 0)
  INTO v_count
  FROM user_subscriptions
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reset_brief_count(p_user_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE user_subscriptions
  SET brief_count = 0,
      updated_at  = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================================================
-- POST-MIGRATION CHECKLIST
-- ============================================================================
-- [ ] Clerk JWT template contains { "sub": "<clerk_user_id>" }
-- [ ] Supabase JWT secret matches Clerk signing key
-- [ ] user_id column on each table populated with Clerk IDs before NOT NULL
-- [ ] Row counts match before/after on: briefs, user_subscriptions,
--     brief_folders, user_feature_activations
-- [ ] Storage uploads tested with Clerk JWT token
-- [ ] RPC calls (increment_brief_count, add_credits_atomic,
--     consume_credits_atomic) tested with TEXT user IDs
-- ============================================================================
