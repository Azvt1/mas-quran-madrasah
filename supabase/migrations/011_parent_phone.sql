-- Add parent WhatsApp/phone number to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
