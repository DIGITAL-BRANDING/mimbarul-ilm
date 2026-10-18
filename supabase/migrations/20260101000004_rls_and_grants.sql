-- 0004: Row Level Security + least-privilege grants.
-- Model: anonymous visitors read PUBLISHED content only. Staff (rows in public.profiles) manage content.
-- Administrators (role = 'admin') additionally publish, manage taxonomy/settings/books/profile, and read audit logs.

-- Nothing is exposed unless granted below (Supabase grants everything by default; we revoke it).
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['profiles','author_profiles','author_profile_translations','media_assets','media_asset_translations',
    'lessons','lesson_translations','categories','category_translations','lesson_categories','tags','tag_translations','lesson_tags',
    'sources','lesson_sources','lesson_media','related_lessons','books','book_translations','url_redirects','site_settings',
    'contact_messages','rate_limits','audit_logs','lesson_revisions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- Table privileges (RLS still filters every row).
grant select on public.author_profiles, public.author_profile_translations, public.media_assets, public.media_asset_translations,
  public.lessons, public.lesson_translations, public.categories, public.category_translations, public.lesson_categories,
  public.tags, public.tag_translations, public.lesson_tags, public.sources, public.lesson_sources, public.lesson_media,
  public.related_lessons, public.books, public.book_translations, public.url_redirects, public.site_settings to anon;

grant select, insert, update, delete on public.profiles, public.author_profiles, public.author_profile_translations,
  public.media_assets, public.media_asset_translations, public.lessons, public.lesson_translations, public.categories,
  public.category_translations, public.lesson_categories, public.tags, public.tag_translations, public.lesson_tags,
  public.sources, public.lesson_sources, public.lesson_media, public.related_lessons, public.books, public.book_translations,
  public.url_redirects, public.site_settings, public.contact_messages to authenticated;
grant select on public.audit_logs, public.lesson_revisions to authenticated;
-- rate_limits: no grants at all (service role only).

---------------------------------------------------------------- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy profiles_insert on public.profiles for insert to authenticated with check (public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin()) with check (id = (select auth.uid()) or public.is_admin());
create policy profiles_delete on public.profiles for delete to authenticated using (public.is_admin() and id <> (select auth.uid()));

------------------------------------------------- author profile (public bio)
create policy author_profiles_read on public.author_profiles for select to anon, authenticated using (true);
create policy author_profiles_write on public.author_profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy author_profile_tr_read on public.author_profile_translations for select to anon, authenticated using (true);
create policy author_profile_tr_write on public.author_profile_translations for all to authenticated using (public.is_admin()) with check (public.is_admin());

------------------------------------------------------------------ media
create policy media_assets_public_read on public.media_assets for select to anon using (is_public);
create policy media_assets_staff_read on public.media_assets for select to authenticated using (is_public or public.is_staff());
create policy media_assets_staff_write on public.media_assets for insert to authenticated with check (public.is_staff());
create policy media_assets_staff_update on public.media_assets for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy media_assets_admin_delete on public.media_assets for delete to authenticated using (public.is_admin());

create policy media_tr_public_read on public.media_asset_translations for select to anon
  using (exists (select 1 from public.media_assets m where m.id = media_id and m.is_public));
create policy media_tr_staff_read on public.media_asset_translations for select to authenticated
  using (public.is_staff() or exists (select 1 from public.media_assets m where m.id = media_id and m.is_public));
create policy media_tr_staff_write on public.media_asset_translations for all to authenticated using (public.is_staff()) with check (public.is_staff());

------------------------------------------------------- lessons & translations
create policy lessons_public_read on public.lessons for select to anon using (public.lesson_is_public(id));
create policy lessons_staff_read on public.lessons for select to authenticated using (public.is_staff() or public.lesson_is_public(id));
create policy lessons_staff_insert on public.lessons for insert to authenticated with check (public.is_staff());
create policy lessons_staff_update on public.lessons for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy lessons_admin_delete on public.lessons for delete to authenticated using (public.is_admin());

create policy lt_public_read on public.lesson_translations for select to anon
  using (status = 'published' and published_at <= now());
create policy lt_staff_read on public.lesson_translations for select to authenticated
  using (public.is_staff() or (status = 'published' and published_at <= now()));
create policy lt_staff_insert on public.lesson_translations for insert to authenticated with check (public.is_staff());
create policy lt_staff_update on public.lesson_translations for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy lt_admin_delete on public.lesson_translations for delete to authenticated using (public.is_admin());

------------------------------------------------------- taxonomy (non-sensitive)
create policy categories_read on public.categories for select to anon, authenticated using (true);
create policy categories_write on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy category_tr_read on public.category_translations for select to anon, authenticated using (true);
create policy category_tr_write on public.category_translations for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy tags_read on public.tags for select to anon, authenticated using (true);
create policy tags_write on public.tags for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy tag_tr_read on public.tag_translations for select to anon, authenticated using (true);
create policy tag_tr_write on public.tag_translations for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Join tables: visible only for lessons that are publicly visible; staff manage.
create policy lesson_categories_read on public.lesson_categories for select to anon, authenticated using (public.lesson_is_public(lesson_id) or public.is_staff());
create policy lesson_categories_write on public.lesson_categories for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy lesson_tags_read on public.lesson_tags for select to anon, authenticated using (public.lesson_is_public(lesson_id) or public.is_staff());
create policy lesson_tags_write on public.lesson_tags for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy lesson_media_read on public.lesson_media for select to anon, authenticated using (public.lesson_is_public(lesson_id) or public.is_staff());
create policy lesson_media_write on public.lesson_media for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy related_lessons_read on public.related_lessons for select to anon, authenticated
  using ((public.lesson_is_public(lesson_id) and public.lesson_is_public(related_lesson_id)) or public.is_staff());
create policy related_lessons_write on public.related_lessons for all to authenticated using (public.is_staff()) with check (public.is_staff());

--------------------------------------------------------- sources & citations
create policy sources_read on public.sources for select to anon, authenticated using (public.source_is_public(id) or public.is_staff());
create policy sources_write on public.sources for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy lesson_sources_read on public.lesson_sources for select to anon, authenticated using (public.lesson_is_public(lesson_id) or public.is_staff());
create policy lesson_sources_write on public.lesson_sources for all to authenticated using (public.is_staff()) with check (public.is_staff());

------------------------------------------------------------------- books
create policy books_read on public.books for select to anon, authenticated using (public.book_is_public(id) or public.is_staff());
create policy books_write on public.books for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy book_tr_public_read on public.book_translations for select to anon using (status = 'published' and published_at <= now());
create policy book_tr_staff_read on public.book_translations for select to authenticated
  using (public.is_staff() or (status = 'published' and published_at <= now()));
create policy book_tr_write on public.book_translations for all to authenticated using (public.is_admin()) with check (public.is_admin());

----------------------------------------------------------------- operations
create policy redirects_read on public.url_redirects for select to anon, authenticated using (true);
create policy redirects_write on public.url_redirects for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy settings_public_read on public.site_settings for select to anon using (is_public);
create policy settings_staff_read on public.site_settings for select to authenticated using (is_public or public.is_staff());
create policy settings_write on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Contact messages: INSERT happens only server-side (service role) after validation, CAPTCHA and rate limiting.
create policy contact_staff_read on public.contact_messages for select to authenticated using (public.is_staff());
create policy contact_staff_update on public.contact_messages for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy contact_admin_delete on public.contact_messages for delete to authenticated using (public.is_admin());

create policy audit_admin_read on public.audit_logs for select to authenticated using (public.is_admin());
create policy revisions_staff_read on public.lesson_revisions for select to authenticated using (public.is_staff());
-- No INSERT/UPDATE/DELETE policies on audit_logs, lesson_revisions or rate_limits: only triggers / the service role write them.
