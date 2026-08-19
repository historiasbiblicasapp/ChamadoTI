-- ============================================
-- FIX: Deduplicate ticket_categories table
-- Execute no Supabase SQL Editor
-- ============================================

-- 1) Deduplicate: keep first occurrence (lowest id using explicit cast)
CREATE TEMP TABLE temp_category_ids AS
SELECT MIN(id::text)::uuid AS keep_id, name
FROM ticket_categories
GROUP BY name
HAVING COUNT(*) > 1;

-- 2) Rename duplicates before deleting
UPDATE ticket_categories t
SET name = t.name || '_duplicate_' || t.id
WHERE id IN (
  SELECT t2.id
  FROM ticket_categories t2
  LEFT JOIN temp_category_ids tc ON t2.name = tc.name
  WHERE t2.name = tc.name AND t2.id != tc.keep_id
);

-- 3) Delete duplicates
DELETE FROM ticket_categories t1
USING ticket_categories t2
WHERE t1.id > t2.id
  AND t1.name = t2.name;

-- 4) Add unique constraint
ALTER TABLE ticket_categories ADD CONSTRAINT ticket_categories_name_unique UNIQUE (name);

-- 5) Fix tickets pointing to duplicates
UPDATE tickets
SET category_id = (
  SELECT id FROM ticket_categories WHERE name = (
    SELECT name FROM ticket_categories WHERE id = tickets.category_id
  ) LIMIT 1
)
WHERE category_id IN (
  SELECT id FROM ticket_categories c1
  WHERE EXISTS (
    SELECT 1 FROM ticket_categories c2
    WHERE c2.name = c1.name AND c2.id < c1.id
  )
);

-- 6) Force PostgREST reload
NOTIFY pgrst, 'reload schema';
