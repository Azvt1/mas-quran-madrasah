-- ============================================================
-- Migration 005: Term Payments
-- Tracks whether a student has paid their fee for a given term
-- ============================================================

create table if not exists term_payments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(id) on delete cascade,
  term_id     uuid not null references terms(id) on delete cascade,
  paid        boolean not null default false,
  paid_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (student_id, term_id)
);

-- Auto-update updated_at
create or replace function update_term_payments_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger term_payments_updated_at
  before update on term_payments
  for each row execute procedure update_term_payments_updated_at();

-- RLS
alter table term_payments enable row level security;

-- Admin: full access
create policy "admin_all_term_payments" on term_payments
  for all using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- Teacher: read only for their own students
create policy "teacher_read_term_payments" on term_payments
  for select using (
    get_my_role() = 'teacher'
    and exists (
      select 1 from students s
      where s.id = term_payments.student_id
        and s.teacher_id = auth.uid()
    )
  );

-- Student: read their own payment
create policy "student_read_term_payments" on term_payments
  for select using (
    get_my_role() = 'student'
    and exists (
      select 1 from students s
      where s.id = term_payments.student_id
        and s.profile_id = auth.uid()
    )
  );

-- Auto-create a term_payment row for every student when a term is inserted
-- (so all students start as unpaid automatically)
create or replace function create_payments_for_new_term()
returns trigger language plpgsql security definer as $$
begin
  insert into term_payments (student_id, term_id, paid)
  select s.id, new.id, false
  from students s
  where s.is_active = true
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_term_insert_create_payments
  after insert on terms
  for each row execute procedure create_payments_for_new_term();
