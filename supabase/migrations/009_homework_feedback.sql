-- Add feedback fields to homework assignments
ALTER TABLE homework_assignments
  ADD COLUMN IF NOT EXISTS behavior_satisfactory BOOLEAN,
  ADD COLUMN IF NOT EXISTS teacher_feedback TEXT;
