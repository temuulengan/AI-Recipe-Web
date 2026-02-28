-- Migration: Convert Korean prefix values to English
-- This script updates existing post records from Korean to English prefix values
--
-- Mapping:
--   일반 (General) → General
--   공지 (Notice) → Notice
--   레시피 (Recipe) → Recipe
--   질문 (Question) → Question
--   팁 (Tip) → Tip

UPDATE "post"
SET "prefix" = CASE
  WHEN "prefix" = '일반' THEN 'General'
  WHEN "prefix" = '공지' THEN 'Notice'
  WHEN "prefix" = '레시피' THEN 'Recipe'
  WHEN "prefix" = '질문' THEN 'Question'
  WHEN "prefix" = '팁' THEN 'Tip'
  ELSE "prefix"  -- Keep unchanged if it's already English or unknown
END
WHERE "prefix" IN ('일반', '공지', '레시피', '질문', '팁');
