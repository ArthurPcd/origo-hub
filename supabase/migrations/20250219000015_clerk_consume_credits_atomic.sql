-- consume_credits_atomic with TEXT user_id (Clerk compatible)
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
  WHERE user_id = p_user_id::uuid
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
  WHERE user_id = p_user_id::uuid;

  RETURN v_new;
END;
$$;
