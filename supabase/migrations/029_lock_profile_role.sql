-- ============================================================
-- Stop signed-in users changing their own role
-- The "profiles: self or admin update" policy lets a user update
-- every column of their own row, including role. This trigger
-- blocks role changes from the app and website API unless the
-- caller is already an admin. The service role and the SQL editor
-- are not affected, so creating users keeps working.
--
-- Safe to re-run.
-- ============================================================

create or replace function prevent_self_role_change()
returns trigger as $$
begin
  if new.role is distinct from old.role
     and current_user in ('authenticated', 'anon')
     and get_my_role() is distinct from 'admin' then
    raise exception 'Not allowed to change role';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_prevent_role_change on profiles;
create trigger profiles_prevent_role_change
  before update on profiles
  for each row execute function prevent_self_role_change();
