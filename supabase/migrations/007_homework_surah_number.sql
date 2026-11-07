-- Add surah_number to homework so Quran progress can be derived from assignments
ALTER TABLE homework ADD COLUMN IF NOT EXISTS surah_number INTEGER;
