-- ============================================================
-- Let a signed-in user change their own login email from the app.
-- The website does this with the service-role key (admin API,
-- email_confirm: true) because the @masmadrasa.com addresses can't
-- receive confirmation emails. The app only has the anon key, so this
-- security-definer function does the same thing, for the caller only.
-- ============================================================

create or replace function public.update_my_email(new_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text := lower(trim(new_email));
  v_old   text;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Please enter a valid email address';
  end if;

  if exists (select 1 from auth.users where lower(email) = v_email and id <> v_uid) then
    raise exception 'That email is already used by another account';
  end if;

  select email into v_old from auth.users where id = v_uid;

  -- Same effect as admin.updateUserById(..., { email, email_confirm: true })
  update auth.users
     set email              = v_email,
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         email_change       = '',
         email_change_token_new = '',
         updated_at         = now()
   where id = v_uid;

  update auth.identities
     set identity_data = identity_data || jsonb_build_object('email', v_email),
         -- Older accounts (migrations 006–024) used the email as provider_id
         provider_id   = case when provider_id = v_old then v_email else provider_id end,
         updated_at    = now()
   where user_id = v_uid
     and provider = 'email';
end;
$$;

revoke all on function public.update_my_email(text) from public, anon;
grant execute on function public.update_my_email(text) to authenticated;
