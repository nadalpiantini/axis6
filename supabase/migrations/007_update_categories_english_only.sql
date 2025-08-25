-- Migration: Update categories to English-only names
-- This migration updates the category names to use English as the default

BEGIN;

-- Update categories to use English names as the primary name
UPDATE axis6_categories SET 
  name = JSONB_BUILD_OBJECT('en', (name->>'en'), 'es', (name->>'en')),
  description = JSONB_BUILD_OBJECT('en', (description->>'en'), 'es', (description->>'en'))
WHERE TRUE;

-- Update specific English names and descriptions to be more clear
UPDATE axis6_categories SET 
  name = '{"en": "Physical", "es": "Physical"}',
  description = '{"en": "Exercise, health, and nutrition", "es": "Exercise, health, and nutrition"}'
WHERE slug = 'physical';

UPDATE axis6_categories SET 
  name = '{"en": "Mental", "es": "Mental"}',
  description = '{"en": "Learning, focus, and productivity", "es": "Learning, focus, and productivity"}'
WHERE slug = 'mental';

UPDATE axis6_categories SET 
  name = '{"en": "Emotional", "es": "Emotional"}',
  description = '{"en": "Mood and stress management", "es": "Mood and stress management"}'
WHERE slug = 'emotional';

UPDATE axis6_categories SET 
  name = '{"en": "Social", "es": "Social"}',
  description = '{"en": "Relationships and connections", "es": "Relationships and connections"}'
WHERE slug = 'social';

UPDATE axis6_categories SET 
  name = '{"en": "Spiritual", "es": "Spiritual"}',
  description = '{"en": "Meditation, gratitude, and purpose", "es": "Meditation, gratitude, and purpose"}'
WHERE slug = 'spiritual';

UPDATE axis6_categories SET 
  name = '{"en": "Purpose", "es": "Purpose"}',
  description = '{"en": "Goals, achievements, and contribution", "es": "Goals, achievements, and contribution"}'
WHERE slug = 'purpose';

COMMIT;