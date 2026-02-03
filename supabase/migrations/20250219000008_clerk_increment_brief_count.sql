-- increment_brief_count with TEXT user_id (Clerk compatible)
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
  WHERE user_id = p_user_id::uuid
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
  WHERE user_id = p_user_id::uuid;

  RETURN v_new;
END;
$$;
