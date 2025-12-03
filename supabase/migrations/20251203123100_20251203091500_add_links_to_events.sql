BEGIN;

-- Add links column to events as jsonb[]
ALTER TABLE events ADD COLUMN IF NOT EXISTS links jsonb[];

-- Seed links for featured events (top 2 by featured_rank and published & featured)
UPDATE events e
SET links = ARRAY[
  to_jsonb(ARRAY['Instagram','https://instagram.com','150+ Estimated']),
  to_jsonb(ARRAY['Wevent','https://wevent.fun','150+ Estimated'])
]
WHERE e.is_published = TRUE AND e.is_featured = TRUE AND e.featured_rank IN (1,2);

COMMIT;