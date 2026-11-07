-- ============================================================
-- Phase 4 — Student Advancement
-- ============================================================

alter table students
  add column if not exists ready_to_advance      boolean     default false not null,
  add column if not exists advance_note          text,
  add column if not exists advance_requested_at  timestamptz;
