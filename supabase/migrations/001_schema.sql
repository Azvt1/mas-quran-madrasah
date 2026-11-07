-- ============================================================
-- Quran Madrasa Platform — Initial Schema
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ============================================================
-- ENUM TYPES
-- ============================================================

create type user_role         as enum ('admin', 'teacher', 'student');
create type student_type_enum as enum ('iqra', 'quran');
create type attendance_status as enum ('present', 'late', 'absent', 'excused');
create type class_day         as enum ('tuesday', 'thursday');
create type file_type_enum    as enum ('pdf', 'audio', 'image');
create type invitation_channel as enum ('manual', 'link', 'whatsapp');

-- ============================================================
-- TABLES
-- ============================================================

-- profiles (extends auth.users — one row per user)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null,
  full_name   text      not null,
  phone       text,
  avatar_url  text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- students
create table students (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid unique references profiles(id) on delete cascade,
  teacher_id      uuid references profiles(id) on delete set null,
  student_type    student_type_enum not null,
  date_of_birth   date,
  enrollment_date date default current_date not null,
  is_active       boolean default true not null,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- invitations (MVP: manual; future: WhatsApp link)
create table invitations (
  id          uuid primary key default uuid_generate_v4(),
  created_by  uuid references profiles(id) on delete set null,
  email       text,
  phone       text,
  role        user_role not null,
  teacher_id  uuid references profiles(id) on delete set null,
  token       text unique default encode(gen_random_bytes(32), 'hex') not null,
  sent_via    invitation_channel default 'manual' not null,
  expires_at  timestamptz,
  used_at     timestamptz,
  created_at  timestamptz default now() not null
);

-- class_sessions (Tuesday / Thursday only)
create table class_sessions (
  id           uuid primary key default uuid_generate_v4(),
  session_date date not null unique,
  day_of_week  class_day not null,
  teacher_id   uuid references profiles(id) on delete set null,
  notes        text,
  created_at   timestamptz default now() not null
);

-- attendance_records
create table attendance_records (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references class_sessions(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  status      attendance_status not null,
  notes       text,
  recorded_at timestamptz default now() not null,
  unique (session_id, student_id)
);

-- library_files (created before homework so FK can reference it)
create table library_files (
  id          uuid primary key default uuid_generate_v4(),
  teacher_id  uuid references profiles(id) on delete set null,
  title       text not null,
  description text,
  file_url    text not null,
  file_type   file_type_enum not null,
  file_size   bigint,
  created_at  timestamptz default now() not null
);

-- homework
create table homework (
  id              uuid primary key default uuid_generate_v4(),
  teacher_id      uuid references profiles(id) on delete set null,
  title           text not null,
  instructions    text,
  due_date        date,
  book_reference  text,
  library_file_id uuid references library_files(id) on delete set null,
  audio_file_url  text,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- homework_assignments (links homework to individual students)
create table homework_assignments (
  id           uuid primary key default uuid_generate_v4(),
  homework_id  uuid not null references homework(id) on delete cascade,
  student_id   uuid not null references students(id) on delete cascade,
  is_completed boolean default false not null,
  completed_at timestamptz,
  assigned_at  timestamptz default now() not null,
  unique (homework_id, student_id)
);

-- iqra_progress (current state — snapshotted on every save)
create table iqra_progress (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid unique not null references students(id) on delete cascade,
  current_book    smallint default 1 not null check (current_book between 1 and 6),
  current_page    smallint default 1 not null check (current_page > 0),
  completed_pages jsonb default '{}' not null,
  teacher_notes   text,
  updated_at      timestamptz default now() not null,
  updated_by      uuid references profiles(id) on delete set null
);

-- quran_progress (current state — snapshotted on every save)
create table quran_progress (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid unique not null references students(id) on delete cascade,
  current_surah smallint default 1 not null check (current_surah between 1 and 114),
  current_juz   smallint default 1 not null check (current_juz between 1 and 30),
  current_page  smallint default 1 not null check (current_page between 1 and 604),
  teacher_notes text,
  updated_at    timestamptz default now() not null,
  updated_by    uuid references profiles(id) on delete set null
);

-- progress_snapshots (history — powers the analytics chart)
create table progress_snapshots (
  id           uuid primary key default uuid_generate_v4(),
  student_id   uuid not null references students(id) on delete cascade,
  student_type student_type_enum not null,
  data         jsonb not null,
  recorded_at  timestamptz default now() not null,
  recorded_by  uuid references profiles(id) on delete set null
);

-- student_notes
create table student_notes (
  id                    uuid primary key default uuid_generate_v4(),
  student_id            uuid not null references students(id) on delete cascade,
  teacher_id            uuid references profiles(id) on delete set null,
  content               text not null,
  is_visible_to_student boolean default false not null,
  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger students_updated_at
  before update on students
  for each row execute function update_updated_at();

create trigger homework_updated_at
  before update on homework
  for each row execute function update_updated_at();

create trigger student_notes_updated_at
  before update on student_notes
  for each row execute function update_updated_at();

-- ============================================================
-- RLS HELPER FUNCTIONS
-- (security definer = run as function creator, bypasses RLS
--  so they don't cause recursive policy evaluation)
-- ============================================================

create or replace function get_my_role()
returns user_role as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Returns the students.id (not profile_id) for the current user
create or replace function get_my_student_id()
returns uuid as $$
  select id from students where profile_id = auth.uid()
$$ language sql security definer stable;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles          enable row level security;
alter table students          enable row level security;
alter table invitations        enable row level security;
alter table class_sessions    enable row level security;
alter table attendance_records enable row level security;
alter table library_files     enable row level security;
alter table homework          enable row level security;
alter table homework_assignments enable row level security;
alter table iqra_progress     enable row level security;
alter table quran_progress    enable row level security;
alter table progress_snapshots enable row level security;
alter table student_notes     enable row level security;

-- ---- profiles ----
create policy "profiles: self or admin read" on profiles
  for select using (id = auth.uid() or get_my_role() = 'admin');

create policy "profiles: self or admin update" on profiles
  for update using (id = auth.uid() or get_my_role() = 'admin');

-- ---- students ----
create policy "students: teacher own, student own, admin all" on students
  for select using (
    get_my_role() = 'admin'
    or teacher_id = auth.uid()
    or profile_id = auth.uid()
  );

create policy "students: admin or teacher insert" on students
  for insert with check (get_my_role() in ('admin', 'teacher'));

create policy "students: admin all, teacher own" on students
  for update using (
    get_my_role() = 'admin'
    or teacher_id = auth.uid()
  );

-- ---- invitations ----
create policy "invitations: admin only" on invitations
  for all using (get_my_role() = 'admin');

-- ---- class_sessions ----
create policy "sessions: teacher own or admin" on class_sessions
  for select using (get_my_role() = 'admin' or teacher_id = auth.uid());

create policy "sessions: teacher or admin insert" on class_sessions
  for insert with check (get_my_role() in ('admin', 'teacher'));

create policy "sessions: teacher own or admin update" on class_sessions
  for update using (get_my_role() = 'admin' or teacher_id = auth.uid());

-- ---- attendance_records ----
create policy "attendance: select" on attendance_records
  for select using (
    get_my_role() = 'admin'
    or exists (
      select 1 from class_sessions cs
      where cs.id = session_id and cs.teacher_id = auth.uid()
    )
    or student_id = get_my_student_id()
  );

create policy "attendance: insert" on attendance_records
  for insert with check (
    get_my_role() = 'admin'
    or exists (
      select 1 from class_sessions cs
      where cs.id = session_id and cs.teacher_id = auth.uid()
    )
  );

create policy "attendance: update" on attendance_records
  for update using (
    get_my_role() = 'admin'
    or exists (
      select 1 from class_sessions cs
      where cs.id = session_id and cs.teacher_id = auth.uid()
    )
  );

-- ---- library_files ----
create policy "library: all authenticated read" on library_files
  for select using (auth.uid() is not null);

create policy "library: teacher or admin insert" on library_files
  for insert with check (get_my_role() in ('admin', 'teacher'));

create policy "library: teacher own or admin update" on library_files
  for update using (get_my_role() = 'admin' or teacher_id = auth.uid());

create policy "library: teacher own or admin delete" on library_files
  for delete using (get_my_role() = 'admin' or teacher_id = auth.uid());

-- ---- homework ----
create policy "homework: select" on homework
  for select using (
    get_my_role() = 'admin'
    or teacher_id = auth.uid()
    or exists (
      select 1 from homework_assignments ha
      where ha.homework_id = id and ha.student_id = get_my_student_id()
    )
  );

create policy "homework: teacher or admin insert" on homework
  for insert with check (get_my_role() in ('admin', 'teacher'));

create policy "homework: teacher own or admin update" on homework
  for update using (get_my_role() = 'admin' or teacher_id = auth.uid());

create policy "homework: teacher own or admin delete" on homework
  for delete using (get_my_role() = 'admin' or teacher_id = auth.uid());

-- ---- homework_assignments ----
create policy "hw_assignments: select" on homework_assignments
  for select using (
    get_my_role() = 'admin'
    or exists (
      select 1 from homework h
      where h.id = homework_id and h.teacher_id = auth.uid()
    )
    or student_id = get_my_student_id()
  );

create policy "hw_assignments: teacher or admin insert" on homework_assignments
  for insert with check (
    get_my_role() = 'admin'
    or exists (
      select 1 from homework h
      where h.id = homework_id and h.teacher_id = auth.uid()
    )
  );

create policy "hw_assignments: teacher or admin update" on homework_assignments
  for update using (
    get_my_role() = 'admin'
    or exists (
      select 1 from homework h
      where h.id = homework_id and h.teacher_id = auth.uid()
    )
  );

-- ---- iqra_progress ----
create policy "iqra_progress: select" on iqra_progress
  for select using (
    get_my_role() = 'admin'
    or exists (
      select 1 from students s
      where s.id = student_id and s.teacher_id = auth.uid()
    )
    or student_id = get_my_student_id()
  );

create policy "iqra_progress: teacher or admin insert" on iqra_progress
  for insert with check (
    get_my_role() = 'admin'
    or exists (
      select 1 from students s
      where s.id = student_id and s.teacher_id = auth.uid()
    )
  );

create policy "iqra_progress: teacher or admin update" on iqra_progress
  for update using (
    get_my_role() = 'admin'
    or exists (
      select 1 from students s
      where s.id = student_id and s.teacher_id = auth.uid()
    )
  );

-- ---- quran_progress ----
create policy "quran_progress: select" on quran_progress
  for select using (
    get_my_role() = 'admin'
    or exists (
      select 1 from students s
      where s.id = student_id and s.teacher_id = auth.uid()
    )
    or student_id = get_my_student_id()
  );

create policy "quran_progress: teacher or admin insert" on quran_progress
  for insert with check (
    get_my_role() = 'admin'
    or exists (
      select 1 from students s
      where s.id = student_id and s.teacher_id = auth.uid()
    )
  );

create policy "quran_progress: teacher or admin update" on quran_progress
  for update using (
    get_my_role() = 'admin'
    or exists (
      select 1 from students s
      where s.id = student_id and s.teacher_id = auth.uid()
    )
  );

-- ---- progress_snapshots ----
create policy "snapshots: select" on progress_snapshots
  for select using (
    get_my_role() = 'admin'
    or exists (
      select 1 from students s
      where s.id = student_id and s.teacher_id = auth.uid()
    )
    or student_id = get_my_student_id()
  );

create policy "snapshots: teacher or admin insert" on progress_snapshots
  for insert with check (
    get_my_role() = 'admin'
    or exists (
      select 1 from students s
      where s.id = student_id and s.teacher_id = auth.uid()
    )
  );

-- ---- student_notes ----
create policy "notes: select" on student_notes
  for select using (
    get_my_role() = 'admin'
    or teacher_id = auth.uid()
    or (student_id = get_my_student_id() and is_visible_to_student = true)
  );

create policy "notes: teacher or admin insert" on student_notes
  for insert with check (get_my_role() in ('admin', 'teacher'));

create policy "notes: teacher own or admin update" on student_notes
  for update using (get_my_role() = 'admin' or teacher_id = auth.uid());

create policy "notes: teacher own or admin delete" on student_notes
  for delete using (get_my_role() = 'admin' or teacher_id = auth.uid());
