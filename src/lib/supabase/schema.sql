-- Origo SaaS Database Schema
-- Complete schema for ORIGO brief generation SaaS

-- =============================================================================
-- PROFILES TABLE
-- User profile information (synced with auth.users via trigger)
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role has full access to profiles"
  ON profiles
  FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- =============================================================================
-- USER SUBSCRIPTIONS TABLE
-- Tracks user subscription plans, Stripe integration, and brief usage limits
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Subscription plan (free, starter, pro, premium, enterprise)
  plan TEXT NOT NULL DEFAULT 'free',

  -- Stripe integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,

  -- Subscription status
  status TEXT NOT NULL DEFAULT 'active',
  cancel_at_period_end BOOLEAN DEFAULT FALSE,

  -- Billing period
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,

  -- Usage tracking
  brief_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id),
  UNIQUE(stripe_customer_id),
  UNIQUE(stripe_subscription_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);

-- =============================================================================
-- BRIEFS TABLE
-- Stores generated project briefs with their content and metadata
-- =============================================================================
CREATE TABLE IF NOT EXISTS briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Brief content
  title TEXT NOT NULL,
  project_type TEXT,
  answers JSONB NOT NULL,
  content TEXT NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups and sorting
CREATE INDEX IF NOT EXISTS idx_briefs_user_id ON briefs(user_id);
CREATE INDEX IF NOT EXISTS idx_briefs_created_at ON briefs(created_at DESC);

-- =============================================================================
-- EMAIL LOGS TABLE
-- Tracks sent emails for debugging and compliance
-- =============================================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Email details
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,

  -- Metadata
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);

-- =============================================================================
-- WEBHOOK EVENTS TABLE
-- Stores Stripe webhook events for idempotency and debugging
-- =============================================================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Stripe event details
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,

  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  -- Event data
  payload JSONB NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for idempotency checks and lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- User Subscriptions RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to subscriptions"
  ON user_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Briefs RLS
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own briefs"
  ON briefs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own briefs"
  ON briefs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own briefs"
  ON briefs
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to briefs"
  ON briefs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Email Logs RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to email logs"
  ON email_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Webhook Events RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to webhook events"
  ON webhook_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to increment brief count for a user
CREATE OR REPLACE FUNCTION increment_brief_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Update or insert user subscription record
  INSERT INTO user_subscriptions (user_id, brief_count)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    brief_count = user_subscriptions.brief_count + 1,
    updated_at = NOW()
  RETURNING brief_count INTO v_count;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get brief count for a user
CREATE OR REPLACE FUNCTION get_brief_count(p_user_id UUID)
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

-- Function to reset brief count (useful for billing cycle resets)
CREATE OR REPLACE FUNCTION reset_brief_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_subscriptions
  SET
    brief_count = 0,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp for user_subscriptions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_briefs_updated_at
  BEFORE UPDATE ON briefs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
