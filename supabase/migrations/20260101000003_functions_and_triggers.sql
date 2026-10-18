-- 0003: authorization helpers, integrity triggers, revisions, redirects, audit.

------------------------------------------------------------ role helpers
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()))
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
$$;

-- Visibility helpers (SECURITY DEFINER, boolean only => no data leak, no RLS recursion).
create or replace function public.lesson_is_public(p_lesson_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lesson_translations t
    where t.lesson_id = p_lesson_id and t.status = 'published' and t.published_at <= now()
  )
$$;

create or replace function public.book_is_public(p_book_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.book_translations t
    where t.book_id = p_book_id and t.status = 'published' and t.published_at <= now()
  )
$$;

create or replace function public.source_is_public(p_source_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lesson_sources ls
    where ls.source_id = p_source_id and public.lesson_is_public(ls.lesson_id)
  )
$$;

grant execute on function public.is_staff(), public.is_admin(), public.lesson_is_public(uuid),
  public.book_is_public(uuid), public.source_is_public(uuid) to anon, authenticated;

------------------------------------------------------------- audit helper
create or replace function public.write_audit(p_action text, p_entity_type text, p_entity_id text, p_metadata jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values ((select auth.uid()), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb))
$$;
revoke all on function public.write_audit(text, text, text, jsonb) from public, anon, authenticated;

------------------------------------------------------------ updated_at
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','author_profiles','author_profile_translations','media_assets','lessons',
    'categories','sources','books','book_translations','site_settings'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;
end $$;

------------------------------------------------- profiles: no self-promotion
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- auth.uid() is NULL for the SQL editor / service role / migrations: that is how the first admin is provisioned.
  if (select auth.uid()) is not null and not public.is_admin() then
    if tg_op = 'INSERT' then
      raise exception 'Only an administrator can create staff profiles' using errcode = '42501';
    elsif new.role is distinct from old.role or new.id is distinct from old.id then
      raise exception 'Only an administrator can change roles' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    perform public.write_audit('profile.role_changed', 'profile', new.id::text,
      jsonb_build_object('from', old.role, 'to', new.role));
  end if;
  return new;
end $$;
create trigger profiles_guard_trg before insert or update on public.profiles
  for each row execute function public.profiles_guard();

------------------------------------ lesson_translations: rules and versioning
create or replace function public.lesson_translations_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  allowed boolean;
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, actor);
    new.updated_by := actor;
    new.version := 1;
    if new.status = 'published' and actor is not null and not public.is_admin() then
      raise exception 'Only an administrator can publish' using errcode = '42501';
    end if;
  else
    -- Status transition table (mirrors src/lib/content/publishing.ts).
    if new.status is distinct from old.status then
      allowed := case old.status
        when 'draft'     then new.status in ('in_review', 'published', 'archived')
        when 'in_review' then new.status in ('draft', 'published', 'archived')
        when 'published' then new.status in ('draft', 'archived')
        when 'archived'  then new.status in ('draft')
      end;
      if not allowed then
        raise exception 'Invalid status transition % -> %', old.status, new.status using errcode = '23514';
      end if;
    end if;
    -- Editors may not publish, unpublish, or edit already-published content.
    if actor is not null and not public.is_admin()
       and (old.status = 'published' or new.status = 'published') then
      raise exception 'Only an administrator can change published content' using errcode = '42501';
    end if;
    -- Identity of a translation never changes.
    if new.lesson_id is distinct from old.lesson_id or new.locale is distinct from old.locale then
      raise exception 'lesson_id and locale are immutable' using errcode = '23514';
    end if;
    new.version := old.version + 1;
    new.updated_by := actor;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;

  if new.status = 'in_review' and (tg_op = 'INSERT' or old.status is distinct from 'in_review') then
    new.reviewed_by := null; new.reviewed_at := null;
  end if;

  if new.status = 'published' then
    if btrim(new.title) = '' or btrim(coalesce(new.excerpt, '')) = '' or btrim(new.body_text) = '' then
      raise exception 'Cannot publish: title, excerpt and body are required' using errcode = '23514';
    end if;
    if new.published_at is null then new.published_at := now(); end if;
    if tg_op = 'INSERT' or old.status is distinct from 'published' then
      new.reviewed_by := coalesce(actor, new.reviewed_by);
      new.reviewed_at := now();
    end if;
  end if;

  new.updated_at := now();
  return new;
end $$;
create trigger lesson_translations_guard_trg before insert or update on public.lesson_translations
  for each row execute function public.lesson_translations_guard();

------------------------------------------------- slug change => 301 redirect
create or replace function public.lesson_translations_redirect() returns trigger
language plpgsql security definer set search_path = '' as $$
declare old_path text; new_path text;
begin
  if new.slug is distinct from old.slug and old.status = 'published' then
    old_path := '/' || old.locale || '/lessons/' || old.slug;
    new_path := '/' || new.locale || '/lessons/' || new.slug;
    delete from public.url_redirects where from_path = new_path;        -- never redirect away from a live URL
    update public.url_redirects set to_path = new_path where to_path = old_path; -- collapse chains
    insert into public.url_redirects (from_path, to_path) values (old_path, new_path)
      on conflict (from_path) do update set to_path = excluded.to_path;
    perform public.write_audit('lesson.slug_changed', 'lesson_translation', new.id::text,
      jsonb_build_object('from', old.slug, 'to', new.slug));
  end if;
  return new;
end $$;
create trigger lesson_translations_redirect_trg after update of slug on public.lesson_translations
  for each row execute function public.lesson_translations_redirect();

---------------------------------------------------------- revision history
-- Snapshot on creation, on every status change, and otherwise at most once per 5 minutes per editor
-- (autosave would otherwise create hundreds of near-identical rows).
create or replace function public.lesson_translations_revision() returns trigger
language plpgsql security definer set search_path = '' as $$
declare last_rev timestamptz; actor uuid := (select auth.uid()); changed boolean;
begin
  if tg_op = 'UPDATE' then
    changed := (new.title, new.slug, new.excerpt, new.body, new.seo_title, new.seo_description, new.status)
      is distinct from (old.title, old.slug, old.excerpt, old.body, old.seo_title, old.seo_description, old.status);
    if not changed then return new; end if;
    select max(created_at) into last_rev from public.lesson_revisions
      where translation_id = new.id and created_by is not distinct from actor;
    if new.status is not distinct from old.status and last_rev is not null and last_rev > now() - interval '5 minutes' then
      return new;
    end if;
  end if;
  insert into public.lesson_revisions (translation_id, lesson_id, locale, version, snapshot, created_by)
  values (new.id, new.lesson_id, new.locale, new.version,
    jsonb_build_object('title', new.title, 'slug', new.slug, 'excerpt', new.excerpt, 'body', new.body,
      'seo_title', new.seo_title, 'seo_description', new.seo_description, 'status', new.status), actor);
  return new;
end $$;
create trigger lesson_translations_revision_trg after insert or update on public.lesson_translations
  for each row execute function public.lesson_translations_revision();

------------------------------------------------------------- audit trail
create or replace function public.lesson_translations_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform public.write_audit('lesson.created', 'lesson_translation', new.id::text,
      jsonb_build_object('locale', new.locale, 'status', new.status));
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    perform public.write_audit('lesson.status_changed', 'lesson_translation', new.id::text,
      jsonb_build_object('locale', new.locale, 'from', old.status, 'to', new.status));
  elsif tg_op = 'DELETE' then
    perform public.write_audit('lesson.deleted', 'lesson_translation', old.id::text,
      jsonb_build_object('locale', old.locale, 'slug', old.slug, 'status', old.status));
    return old;
  end if;
  return new;
end $$;
create trigger lesson_translations_audit_trg after insert or update or delete on public.lesson_translations
  for each row execute function public.lesson_translations_audit();

create or replace function public.generic_delete_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.write_audit(tg_table_name || '.deleted', tg_table_name, old.id::text, '{}'::jsonb);
  return old;
end $$;
create trigger media_assets_audit_trg after delete on public.media_assets for each row execute function public.generic_delete_audit();
create trigger sources_audit_trg after delete on public.sources for each row execute function public.generic_delete_audit();
create trigger books_audit_trg after delete on public.books for each row execute function public.generic_delete_audit();
create trigger lessons_audit_trg after delete on public.lessons for each row execute function public.generic_delete_audit();

-- Audit log is append-only, even for privileged roles reaching it via SQL.
create or replace function public.audit_logs_immutable() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'audit_logs is append-only' using errcode = '42501';
end $$;
create trigger audit_logs_no_update before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();
