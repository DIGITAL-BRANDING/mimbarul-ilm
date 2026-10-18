-- 0005: Storage buckets and policies. Skipped automatically on plain Postgres (no `storage` schema).
--
-- media-private : every upload lands here. Only staff can read/write. Drafts are never public.
-- media-public  : copy of a file is placed here by the server (service role) when the asset is attached to
--                 publicly visible content, and removed when it is no longer public.
-- SVG, HTML and executables are deliberately NOT allowed (script execution risk on our origin).
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
      ('media-private', 'media-private', false, 52428800,
        array['image/jpeg','image/png','image/webp','image/avif','audio/mpeg','audio/mp4','audio/ogg','audio/wav','application/pdf']),
      ('media-public', 'media-public', true, 52428800,
        array['image/jpeg','image/png','image/webp','image/avif','audio/mpeg','audio/mp4','audio/ogg','audio/wav','application/pdf'])
    on conflict (id) do update
      set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

    execute $p$create policy "media_private_staff_select" on storage.objects for select to authenticated
      using (bucket_id = 'media-private' and public.is_staff())$p$;
    execute $p$create policy "media_private_staff_insert" on storage.objects for insert to authenticated
      with check (bucket_id = 'media-private' and public.is_staff())$p$;
    execute $p$create policy "media_private_staff_update" on storage.objects for update to authenticated
      using (bucket_id = 'media-private' and public.is_staff()) with check (bucket_id = 'media-private' and public.is_staff())$p$;
    execute $p$create policy "media_private_admin_delete" on storage.objects for delete to authenticated
      using (bucket_id = 'media-private' and public.is_admin())$p$;
    -- media-public: intentionally NO insert/update/delete policies. Only the service role (server) writes there.
  end if;
end $$;
