-- ============================================================================
-- Migration 006: PDF AI Access Beta Activation Code
-- ============================================================================
-- Creates a temporary activation code PDFBETA24 for testing AI Pro PDF
-- Feature: PDF_AI_ACCESS bypasses the plan check in /api/brief/[id]/pdf-ai
-- ============================================================================

-- Insert beta test code for PDF AI access
-- Single use, expires 2026-03-31
INSERT INTO activation_codes (code, feature_code, max_uses, valid_until, metadata)
VALUES (
  'PDFBETA24',
  'PDF_AI_ACCESS',
  1,
  '2026-03-31 23:59:59+00',
  '{"description": "Beta test code for AI Pro PDF generation", "created_for": "internal_testing", "temporary": true}'
)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Post-Migration Checklist:
-- [ ] Run in Supabase SQL Editor (with service_role or directly)
-- [ ] Verify: SELECT * FROM activation_codes WHERE code = 'PDFBETA24';
-- [ ] Test: activate via /account → activate code → PDFBETA24
-- [ ] Test: use AI Pro PDF generation on a brief
-- [ ] After testing: DELETE FROM activation_codes WHERE code = 'PDFBETA24';
-- ============================================================================
