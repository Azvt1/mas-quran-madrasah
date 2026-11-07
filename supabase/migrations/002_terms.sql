-- ============================================================
-- Phase 2 — Terms & Class Sessions
-- ============================================================

-- 1. Terms table
-- ============================================================
create table terms (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  start_date date not null,
  end_date   date not null,
  is_active  boolean default false not null,
  created_at timestamptz default now() not null
);

alter table terms enable row level security;

create policy "terms: all authenticated read" on terms
  for select using (auth.uid() is not null);

create policy "terms: admin insert" on terms
  for insert with check (get_my_role() = 'admin');

create policy "terms: admin update" on terms
  for update using (get_my_role() = 'admin');


-- 2. Add term_id to class_sessions
-- ============================================================
alter table class_sessions
  add column term_id uuid references terms(id);


-- 3. Update class_sessions RLS
--    Sessions are shared across all teachers — any authenticated user can read.
--    Only admin can insert (we seed sessions via migration, not from the app).
-- ============================================================
drop policy if exists "sessions: teacher own or admin"    on class_sessions;
drop policy if exists "sessions: teacher or admin insert" on class_sessions;
drop policy if exists "sessions: teacher own or admin update" on class_sessions;

create policy "sessions: all authenticated read" on class_sessions
  for select using (auth.uid() is not null);

create policy "sessions: admin insert" on class_sessions
  for insert with check (get_my_role() = 'admin');

create policy "sessions: admin update" on class_sessions
  for update using (get_my_role() = 'admin');


-- 4. Update attendance_records RLS
--    Teachers mark attendance for their own students (not tied to session.teacher_id).
-- ============================================================
drop policy if exists "attendance: select" on attendance_records;
drop policy if exists "attendance: insert" on attendance_records;
drop policy if exists "attendance: update" on attendance_records;

create policy "attendance: select" on attendance_records
  for select using (
    get_my_role() = 'admin'
    or exists (
      select 1 from students s
      where s.id = student_id and s.teacher_id = auth.uid()
    )
    or student_id = get_my_student_id()
  );

create policy "attendance: insert" on attendance_records
  for insert with check (
    get_my_role() = 'admin'
    or exists (
      select 1 from students s
      where s.id = student_id and s.teacher_id = auth.uid()
    )
  );

create policy "attendance: update" on attendance_records
  for update using (
    get_my_role() = 'admin'
    or exists (
      select 1 from students s
      where s.id = student_id and s.teacher_id = auth.uid()
    )
  );


-- 5. Seed Term 1
-- ============================================================
insert into terms (id, name, start_date, end_date, is_active)
values (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Term 1',
  '2026-08-04',
  '2026-09-24',
  true
);


-- 6. Generate all Tuesday + Thursday sessions for Term 1
--    DOW: 2 = Tuesday, 4 = Thursday
-- ============================================================
insert into class_sessions (session_date, day_of_week, term_id)
select
  d::date,
  case extract(dow from d)
    when 2 then 'tuesday'::class_day
    when 4 then 'thursday'::class_day
  end,
  'a1b2c3d4-0000-0000-0000-000000000001'
from generate_series(
  '2026-08-04'::date,
  '2026-09-24'::date,
  '1 day'::interval
) d
where extract(dow from d) in (2, 4);
