-- ============================================================================
-- Migration 20250219000007: Drop old UUID overloads for atomic functions
-- ============================================================================
DO $drop_old$
BEGIN
  DROP FUNCTION IF EXISTS increment_brief_count(UUID, INT);
  DROP FUNCTION IF EXISTS add_credits_atomic(UUID, INT);
  DROP FUNCTION IF EXISTS consume_credits_atomic(UUID, INT, INT);
END;
$drop_old$;
