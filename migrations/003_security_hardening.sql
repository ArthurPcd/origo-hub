-- Migration 003: Security Hardening
-- Fixes race condition in brief generation credit check with atomic increment

-- Atomic credit increment function (prevents race condition bypass)
-- Returns the new brief_count, or -1 if limit reached
CREATE OR REPLACE FUNCTION increment_brief_count(
  p_user_id UUID,
  p_limit INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current INT;
  v_new INT;
BEGIN
  -- Lock the row for this user to prevent concurrent access
  SELECT brief_count INTO v_current
  FROM user_subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- If no subscription row, return -1 (caller handles insert)
  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  -- Check if limit is reached (p_limit = -1 means unlimited)
  IF p_limit != -1 AND v_current >= p_limit THEN
    RETURN -2; -- Limit reached signal
  END IF;

  -- Atomically increment
  v_new := v_current + 1;

  UPDATE user_subscriptions
  SET brief_count = v_new
  WHERE user_id = p_user_id;

  RETURN v_new;
END;
$$;

-- Grant execute to authenticated users only (function uses SECURITY DEFINER)
REVOKE ALL ON FUNCTION increment_brief_count FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_brief_count TO authenticated;

-- Atomic credit addition function (for webhooks - no limit check needed)
CREATE OR REPLACE FUNCTION add_credits_atomic(
  p_user_id UUID,
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

-- Add index on user_subscriptions.user_id if not exists (for row locking performance)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
