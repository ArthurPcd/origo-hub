-- ============================================================================
-- ORIGO Phase 2: Briefs Skin UI + Animation Identity
-- Migration 001: Database Schema Changes
-- ============================================================================
-- Created: 2026-02-15
-- Description: Adds folder system, skin system, feature activation system,
--              and extends briefs table with Phase 2 metadata
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. BRIEF FOLDERS (Organization System)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS brief_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#00D9FF',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_folder_name UNIQUE(user_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brief_folders_user_id ON brief_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_brief_folders_position ON brief_folders(user_id, position);

-- Row Level Security
ALTER TABLE brief_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own folders" ON brief_folders;
CREATE POLICY "Users manage own folders"
  ON brief_folders FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. BRIEF SKINS (Visual Themes Catalog)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS brief_skins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('collector', 'pro', 'premium')),
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (Read-only for everyone)
ALTER TABLE brief_skins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read skins" ON brief_skins;
CREATE POLICY "Anyone can read skins"
  ON brief_skins FOR SELECT
  USING (true);

-- Seed Skins Data
INSERT INTO brief_skins (id, name, tier, config) VALUES
  (
    'collector-album',
    'Collector Album',
    'collector',
    '{"borderStyle":"rounded-xl","showLogo":true,"bookMode":true,"accentColor":"#00D9FF"}'::jsonb
  ),
  (
    'pro-minimal',
    'Pro Minimal',
    'pro',
    '{"borderStyle":"rounded-lg","showLogo":false,"bookMode":false,"accentColor":"#6B7CFF"}'::jsonb
  ),
  (
    'pro-emerald',
    'Pro Emerald',
    'pro',
    '{"borderStyle":"rounded-lg","showLogo":false,"bookMode":false,"accentColor":"#10B981"}'::jsonb
  ),
  (
    'pro-slate',
    'Pro Slate',
    'pro',
    '{"borderStyle":"rounded-lg","showLogo":false,"bookMode":false,"accentColor":"#64748B"}'::jsonb
  ),
  (
    'premium-purple',
    'Premium Purple',
    'premium',
    '{"borderStyle":"rounded-2xl","showLogo":true,"bookMode":false,"accentColor":"#A855F7"}'::jsonb
  ),
  (
    'premium-amber',
    'Premium Amber',
    'premium',
    '{"borderStyle":"rounded-2xl","showLogo":true,"bookMode":false,"accentColor":"#F59E0B"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. USER FEATURE ACTIVATIONS (Feature Gating)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_feature_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_code TEXT NOT NULL,
  activation_code_used TEXT,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  CONSTRAINT unique_user_feature UNIQUE(user_id, feature_code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_feature_user ON user_feature_activations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_code ON user_feature_activations(feature_code);

-- Row Level Security
ALTER TABLE user_feature_activations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own activations" ON user_feature_activations;
CREATE POLICY "Users view own activations"
  ON user_feature_activations FOR SELECT
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ACTIVATION CODES (Server-Side Only - NO RLS)
-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY: This table has NO RLS policies - only service_role can access
-- Client should NEVER query this table directly
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  feature_code TEXT NOT NULL,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_activation_codes_feature ON activation_codes(feature_code);

-- NO RLS - only service_role can access (security by design)

-- Seed ORIG0FREY Collector Edition Code
INSERT INTO activation_codes (code, feature_code, max_uses, valid_until, metadata) VALUES
  (
    'ORIG0FREY',
    'COLLECTOR_EDITION',
    10,
    NULL, -- No expiry
    '{"campaign":"First 10 collectors","edition":"Collector Edition"}'::jsonb
  )
ON CONFLICT (code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. EXTEND BRIEFS TABLE (Phase 2 Metadata)
-- ─────────────────────────────────────────────────────────────────────────────

-- Add new columns (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'briefs' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE briefs ADD COLUMN folder_id UUID REFERENCES brief_folders(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'briefs' AND column_name = 'skin_id'
  ) THEN
    ALTER TABLE briefs ADD COLUMN skin_id TEXT REFERENCES brief_skins(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'briefs' AND column_name = 'custom_logo_url'
  ) THEN
    ALTER TABLE briefs ADD COLUMN custom_logo_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'briefs' AND column_name = 'custom_title'
  ) THEN
    ALTER TABLE briefs ADD COLUMN custom_title TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'briefs' AND column_name = 'book_viewer_enabled'
  ) THEN
    ALTER TABLE briefs ADD COLUMN book_viewer_enabled BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_briefs_folder ON briefs(folder_id);
CREATE INDEX IF NOT EXISTS idx_briefs_skin ON briefs(skin_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SUPABASE STORAGE BUCKET (brief-logos)
-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: Run this via Supabase Dashboard or API if not exists
-- Storage bucket for user-uploaded brief logos
-- Configuration:
--   - Name: brief-logos
--   - Public: true (read access)
--   - File size limit: 2MB
--   - Allowed MIME types: image/png, image/jpeg, image/svg+xml
-- ─────────────────────────────────────────────────────────────────────────────

-- RLS Policies for storage (run via Supabase Storage UI or API)
-- Policy 1: Users can upload to own folder
--   bucket_id = 'brief-logos' AND auth.uid()::text = (storage.foldername(name))[1]
-- Policy 2: Anyone can view brief logos
--   bucket_id = 'brief-logos'

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. HELPER FUNCTIONS (Optional)
-- ─────────────────────────────────────────────────────────────────────────────

-- Function to increment activation code usage
CREATE OR REPLACE FUNCTION increment_activation_code_usage(p_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE activation_codes
  SET current_uses = current_uses + 1
  WHERE code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has feature
CREATE OR REPLACE FUNCTION user_has_feature(p_user_id UUID, p_feature_code TEXT)
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

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- Post-Migration Checklist:
-- [ ] Verify all tables created successfully
-- [ ] Verify ORIG0FREY code exists in activation_codes
-- [ ] Verify skins seed data loaded (6 skins)
-- [ ] Verify RLS policies active on all tables (except activation_codes)
-- [ ] Create brief-logos storage bucket in Supabase Dashboard
-- [ ] Configure storage RLS policies for brief-logos bucket
-- ============================================================================
