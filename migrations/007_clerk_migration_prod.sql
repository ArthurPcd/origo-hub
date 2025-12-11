-- ============================================================================
-- Migration 007: Clerk User ID - Safe Production Migration (v2)
-- ============================================================================
-- FIX: Drop ALL policies FIRST, then alter column types, then recreate.
-- PostgreSQL cannot alter a column type used in a policy definition.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DROP ALL RLS POLICIES (dynamic — no hardcoded names needed)
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('briefs', 'user_subscriptions', 'brief_folders', 'user_feature_activations')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: ALTER COLUMN TYPES (UUID → TEXT)
-- ============================================================================

-- briefs
ALTER TABLE briefs DROP CONSTRAINT IF EXISTS briefs_user_id_fkey;
ALTER TABLE briefs ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- user_subscriptions
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_key;
ALTER TABLE user_subscriptions ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);

-- brief_folders
ALTER TABLE brief_folders DROP CONSTRAINT IF EXISTS brief_folders_user_id_fkey;
ALTER TABLE brief_folders DROP CONSTRAINT IF EXISTS unique_user_folder_name;
ALTER TABLE brief_folders ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE brief_folders ADD CONSTRAINT unique_user_folder_name UNIQUE (user_id, name);

-- user_feature_activations
ALTER TABLE user_feature_activations DROP CONSTRAINT IF EXISTS user_feature_activations_user_id_fkey;
ALTER TABLE user_feature_activations DROP CONSTRAINT IF EXISTS unique_user_feature;
ALTER TABLE user_feature_activations ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE user_feature_activations ADD CONSTRAINT unique_user_feature UNIQUE (user_id, feature_code);

-- ============================================================================
-- STEP 3: RECREATE INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_briefs_user_id;
CREATE INDEX idx_briefs_user_id ON briefs(user_id);

DROP INDEX IF EXISTS idx_user_subscriptions_user_id;
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);

DROP INDEX IF EXISTS idx_brief_folders_user_id;
DROP INDEX IF EXISTS idx_brief_folders_position;
CREATE INDEX idx_brief_folders_user_id ON brief_folders(user_id);
CREATE INDEX idx_brief_folders_position ON brief_folders(user_id, position);

DROP INDEX IF EXISTS idx_user_feature_user;
CREATE INDEX idx_user_feature_user ON user_feature_activations(user_id);

-- ============================================================================
-- STEP 4: RECREATE RLS POLICIES (using Clerk JWT sub)
-- ============================================================================

-- briefs
CREATE POLICY "Users can view own briefs"    ON briefs FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can insert own briefs"  ON briefs FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can update own briefs"  ON briefs FOR UPDATE USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can delete own briefs"  ON briefs FOR DELETE USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Service role has full access to briefs" ON briefs FOR ALL USING (auth.role() = 'service_role');

-- user_subscriptions
CREATE POLICY "Users can view own subscription" ON user_subscriptions FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Service role has full access to subscriptions" ON user_subscriptions FOR ALL USING (auth.role() = 'service_role');

-- brief_folders
CREATE POLICY "Users manage own folders" ON brief_folders FOR ALL USING ((auth.jwt() ->> 'sub') = user_id);

-- user_feature_activations
CREATE POLICY "Users view own activations" ON user_feature_activations FOR ALL USING ((auth.jwt() ->> 'sub') = user_id);

-- ============================================================================
-- STEP 5: STORAGE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users upload own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users update own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users read own logos" ON storage.objects;

CREATE POLICY "Users upload own logos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brief-logos' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users update own logos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'brief-logos' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users delete own logos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'brief-logos' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users read own logos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'brief-logos' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub'));

-- ============================================================================
-- STEP 6: ATOMIC FUNCTIONS (UUID → TEXT parameters)
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_brief_count(p_user_id TEXT, p_limit INT)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current INT; v_new INT;
BEGIN
  SELECT brief_count INTO v_current FROM user_subscriptions WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN -1; END IF;
  IF p_limit != -1 AND v_current >= p_limit THEN RETURN -2; END IF;
  v_new := v_current + 1;
  UPDATE user_subscriptions SET brief_count = v_new WHERE user_id = p_user_id;
  RETURN v_new;
END; $$;

REVOKE ALL ON FUNCTION increment_brief_count FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_brief_count TO authenticated;

CREATE OR REPLACE FUNCTION add_credits_atomic(p_user_id TEXT, p_credits INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE user_subscriptions SET brief_count = brief_count + p_credits WHERE user_id = p_user_id;
END; $$;

REVOKE ALL ON FUNCTION add_credits_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION add_credits_atomic TO authenticated, service_role;

CREATE OR REPLACE FUNCTION consume_credits_atomic(p_user_id TEXT, p_amount INT, p_limit INT)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current INT; v_new INT;
BEGIN
  SELECT brief_count INTO v_current FROM user_subscriptions WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN -1; END IF;
  IF p_limit != -1 AND (v_current + p_amount) > p_limit THEN RETURN -2; END IF;
  v_new := v_current + p_amount;
  UPDATE user_subscriptions SET brief_count = v_new WHERE user_id = p_user_id;
  RETURN v_new;
END; $$;

REVOKE ALL ON FUNCTION consume_credits_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_credits_atomic TO authenticated;

COMMIT;

-- ============================================================================
-- APRÈS LA MIGRATION: Insère ta subscription (remplace YOUR_CLERK_USER_ID)
-- ============================================================================
-- INSERT INTO user_subscriptions (user_id, plan, status, brief_count)
-- VALUES ('user_39uCw0cAqct8xTxL3WFBN9XRBa9', 'free', 'active', 0)
-- ON CONFLICT (user_id) DO NOTHING;
-- ============================================================================
