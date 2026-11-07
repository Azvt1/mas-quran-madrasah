-- ============================================================
-- RLS additions for the mobile app
-- The website reads names with the service-role key (bypasses RLS).
-- The app only has the anon key, so it needs these policies:
-- 1. Teachers can read the profiles (names) of their own students
-- 2. Students can read their own teacher's profile (name)
-- 3. Teachers can delete assignments of homework they created
--    (the website did this with the service-role key)
-- ============================================================

drop policy if exists "profiles: teacher reads own students" on profiles;
create policy "profiles: teacher reads own students" on profiles
  for select using (
    exists (
      select 1 from students s
      where s.profile_id = profiles.id
        and s.teacher_id = auth.uid()
    )
  );

drop policy if exists "profiles: student reads own teacher" on profiles;
create policy "profiles: student reads own teacher" on profiles
  for select using (
    exists (
      select 1 from students s
      where s.teacher_id = profiles.id
        and s.profile_id = auth.uid()
    )
  );

drop policy if exists "hw_assignments: teacher delete" on homework_assignments;
create policy "hw_assignments: teacher delete" on homework_assignments
  for delete using (
    exists (
      select 1 from homework h
      where h.id = homework_id
        and h.teacher_id = auth.uid()
    )
  );
