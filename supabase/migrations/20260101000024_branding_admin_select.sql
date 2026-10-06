-- Storage looks an object up (under the caller's RLS) before it will replace or
-- delete it, so admins need to be able to see the branding files they manage.
-- Reads of the public URL itself do not depend on this.
create policy "branding_select" on storage.objects for select to authenticated
  using (bucket_id = 'branding' and (select private.is_admin()));
