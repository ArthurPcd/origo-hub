-- add_credits_atomic with TEXT user_id (Clerk compatible)
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
  WHERE user_id = p_user_id::uuid;
END;
$$;
