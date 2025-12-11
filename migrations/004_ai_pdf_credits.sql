-- Migration 004: AI Pro PDF Credits
-- Adds consume_credits_atomic RPC to deduct N credits in one atomic operation
-- Used by /api/brief/[id]/pdf-ai to charge 2 credits per AI-enhanced PDF

-- Atomic multi-credit consumption function
-- Returns: new brief_count on success, -2 if not enough credits
CREATE OR REPLACE FUNCTION consume_credits_atomic(
  p_user_id UUID,
  p_amount  INT,    -- credits to consume (e.g. 2 for AI PDF)
  p_limit   INT     -- plan limit (-1 = unlimited)
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
  -- Lock row to prevent race conditions
  SELECT brief_count INTO v_current
  FROM user_subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- No subscription row
  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  -- Check available credits (unlimited = -1)
  IF p_limit != -1 AND (v_current + p_amount) > p_limit THEN
    RETURN -2; -- Not enough credits
  END IF;

  v_new := v_current + p_amount;

  UPDATE user_subscriptions
  SET brief_count = v_new
  WHERE user_id = p_user_id;

  RETURN v_new;
END;
$$;

-- Restrict to authenticated users only
REVOKE ALL ON FUNCTION consume_credits_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_credits_atomic TO authenticated;
