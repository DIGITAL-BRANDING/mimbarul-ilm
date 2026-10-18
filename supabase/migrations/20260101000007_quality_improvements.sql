-- 0007: additions adopted after reviewing an alternative schema draft.
-- Additive and safe to run on a database that already has migrations 0001-0006.

------------------------------------------------ 1. translation review status
-- Distinguishes a reviewed translation from a raw one. Any later edit to the text resets it,
-- so "reviewed" can never silently describe content that changed after review.
do $$ begin
  create type public.translation_review_status as enum ('unreviewed', 'reviewed');
exception when duplicate_object then null; end $$;

alter table public.lesson_translations
  add column if not exists review_status public.translation_review_status not null default 'unreviewed';

create or replace function public.lesson_translations_review_reset() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.review_status = 'reviewed' and new.review_status = 'reviewed'
     and (new.title, new.excerpt, new.body) is distinct from (old.title, old.excerpt, old.body) then
    new.review_status := 'unreviewed';
  end if;
  return new;
end $$;
drop trigger if exists lesson_translations_review_reset_trg on public.lesson_translations;
create trigger lesson_translations_review_reset_trg before update on public.lesson_translations
  for each row execute function public.lesson_translations_review_reset();

------------------------------------------- 2. verified flag on every citation
-- A citation is "verified" only when a named staff member has checked it against the actual source.
-- Unverified citations remain explicit rather than being assumed correct.
alter table public.lesson_sources
  add column if not exists reference_verified boolean not null default false,
  add column if not exists verified_by uuid references public.profiles (id) on delete set null,
  add column if not exists verified_at timestamptz;

create or replace function public.lesson_sources_verification() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.reference_verified then
    if tg_op = 'INSERT' or not old.reference_verified then
      new.verified_by := (select auth.uid());
      new.verified_at := now();
    else
      new.verified_by := old.verified_by; new.verified_at := old.verified_at;
    end if;
  else
    new.verified_by := null; new.verified_at := null;
  end if;
  -- Changing the cited locator/quotation/grade invalidates a previous verification.
  if tg_op = 'UPDATE' and old.reference_verified and new.reference_verified
     and (new.source_id, new.volume, new.page, new.chapter, new.hadith_number, new.edition_locator, new.quotation, new.authenticity_grade)
         is distinct from
         (old.source_id, old.volume, old.page, old.chapter, old.hadith_number, old.edition_locator, old.quotation, old.authenticity_grade) then
    new.reference_verified := false; new.verified_by := null; new.verified_at := null;
  end if;
  return new;
end $$;
drop trigger if exists lesson_sources_verification_trg on public.lesson_sources;
create trigger lesson_sources_verification_trg before insert or update on public.lesson_sources
  for each row execute function public.lesson_sources_verification();

------------------------------------------------- 3. contact message workflow
alter table public.contact_messages
  add column if not exists status text not null default 'new' check (status in ('new', 'read', 'closed'));
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'contact_messages' and column_name = 'is_read') then
    update public.contact_messages set status = 'read' where is_read;
    alter table public.contact_messages drop column is_read;
  end if;
end $$;
create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);

------------------------------------------------- 4. stable category slug
-- Stable, language-independent key (like tags.slug) for admin tooling, seeding and filters.
-- Localized URL slugs remain in category_translations.
alter table public.categories add column if not exists slug text;
update public.categories set slug = 'category-' || substr(id::text, 1, 8) where slug is null;
alter table public.categories alter column slug set not null;
do $$ begin
  alter table public.categories add constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
exception when duplicate_object then null; end $$;
create unique index if not exists categories_slug_key on public.categories (slug);

---------------------------------------- 5. allow uploaded mp4 video (storage)
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    update storage.buckets set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif','audio/mpeg','audio/mp4','audio/ogg','audio/wav','video/mp4','application/pdf']
      where id in ('media-private', 'media-public');
  end if;
end $$;
