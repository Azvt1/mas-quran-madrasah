-- ============================================================
-- Add term_id to homework table
-- Existing homework → Term 3 2026 (the previous active term)
-- New homework will be stamped with the active term at creation time
-- ============================================================

-- 1. Add term_id column (nullable so existing rows don't break)
ALTER TABLE homework
  ADD COLUMN IF NOT EXISTS term_id uuid REFERENCES terms(id);

-- 2. Back-fill all existing homework rows to Term 3 2026
--    (the term that was active before Term 4)
UPDATE homework
SET term_id = (
  SELECT id FROM terms WHERE name = 'Term 3 2026' LIMIT 1
)
WHERE term_id IS NULL;
