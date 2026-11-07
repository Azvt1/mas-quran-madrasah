-- Parent acknowledgement on homework assignments
-- NULL = not yet asked / no response
-- TRUE = parent confirmed they listened
-- FALSE = parent said not yet

ALTER TABLE homework_assignments
  ADD COLUMN IF NOT EXISTS parent_acknowledged BOOLEAN DEFAULT NULL;
