-- Theming and branding: each school picks a colour theme, an optional brand
-- colour, light/dark/system mode, and uploads a logo.

alter table school_settings
  add column brand_color text check (brand_color ~ '^#[0-9a-fA-F]{6}$'),
  add column theme text not null default 'neutral'
    check (theme in ('neutral', 'warm', 'ocean', 'forest', 'plum')),
  add column color_mode text not null default 'light'
    check (color_mode in ('light', 'dark', 'system'));

-- Everything the signed-out pages (login, setup) need to look like the school.
-- Only presentation fields leave this function.
create or replace function public.school_status() returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'set_up', exists (select 1 from public.school_settings),
    'name', (select name from public.school_settings limit 1),
    'logo_path', (select logo_path from public.school_settings limit 1),
    'theme', (select theme from public.school_settings limit 1),
    'brand_color', (select brand_color from public.school_settings limit 1),
    'color_mode', (select color_mode from public.school_settings limit 1)
  )
$$;

-- The logo is shown on the login page, so the bucket is public-read. Only
-- owners/admins may write to it, and only small web images are accepted
-- (no SVG: an SVG opened directly can carry script).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('branding', 'branding', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "branding_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'branding' and (select private.is_admin()));
create policy "branding_update" on storage.objects for update to authenticated
  using (bucket_id = 'branding' and (select private.is_admin()))
  with check (bucket_id = 'branding' and (select private.is_admin()));
create policy "branding_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'branding' and (select private.is_admin()));
