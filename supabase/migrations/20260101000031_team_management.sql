-- Team management that does not need the service-role key.
--
-- Until now the Team tab read auth.users through the admin API, so it only worked
-- once SUPABASE_SERVICE_ROLE_KEY was set. These security-definer functions let an
-- owner or admin do the same from their own session:
--   team_members()      who is on the team
--   pending_signins()   accounts that signed in (e.g. with Google) but have no role yet
--   set_member_role()   give a role to a pending sign-in, or change someone's role
--   remove_member()     take a role away
-- Owner rules: only an owner can grant, change or remove the owner role, and the
-- last owner can't be demoted or removed. Inviting by email still needs the service key.

create function public.team_members()
returns table (user_id uuid, role public.app_role, email text, name text, joined_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not (select private.is_admin()) then raise exception 'not allowed'; end if;
  return query
    select m.user_id, m.role, u.email::text,
           coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1), 'Unknown'),
           m.created_at
      from public.memberships m
      left join auth.users u on u.id = m.user_id
     order by m.created_at;
end $$;

create function public.pending_signins()
returns table (user_id uuid, email text, name text, signed_up_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not (select private.is_admin()) then raise exception 'not allowed'; end if;
  return query
    select u.id, u.email::text,
           coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1), 'Unknown'),
           u.created_at
      from auth.users u
     where not exists (select 1 from public.memberships m where m.user_id = u.id)
       and u.email is not null
     order by u.created_at desc;
end $$;

create function public.set_member_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor public.app_role;
  v_current public.app_role;
begin
  select role into v_actor from public.memberships where user_id = (select auth.uid());
  if v_actor is null or v_actor not in ('owner', 'admin') then raise exception 'not allowed'; end if;
  if not exists (select 1 from auth.users where id = p_user_id) then raise exception 'no such user'; end if;

  select role into v_current from public.memberships where user_id = p_user_id;
  if (p_role = 'owner' or v_current = 'owner') and v_actor <> 'owner' then
    raise exception 'only an owner can change owners';
  end if;
  if v_current = 'owner' and p_role <> 'owner'
     and (select count(*) from public.memberships where role = 'owner') <= 1 then
    raise exception 'a school needs at least one owner';
  end if;

  if v_current is null then
    insert into public.memberships (user_id, role) values (p_user_id, p_role);
  else
    update public.memberships set role = p_role where user_id = p_user_id;
  end if;
end $$;

create function public.remove_member(p_user_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor public.app_role;
  v_current public.app_role;
begin
  select role into v_actor from public.memberships where user_id = (select auth.uid());
  if v_actor is null or v_actor not in ('owner', 'admin') then raise exception 'not allowed'; end if;
  if p_user_id = (select auth.uid()) then raise exception 'you cannot remove yourself'; end if;

  select role into v_current from public.memberships where user_id = p_user_id;
  if v_current is null then return; end if;
  if v_current = 'owner' and v_actor <> 'owner' then raise exception 'only an owner can change owners'; end if;
  -- A teacher's portal link goes with their access.
  update public.instructors set user_id = null where user_id = p_user_id;
  delete from public.memberships where user_id = p_user_id;
end $$;

revoke execute on function public.team_members(), public.pending_signins(),
  public.set_member_role(uuid, public.app_role), public.remove_member(uuid) from public, anon;
grant execute on function public.team_members(), public.pending_signins(),
  public.set_member_role(uuid, public.app_role), public.remove_member(uuid) to authenticated;
