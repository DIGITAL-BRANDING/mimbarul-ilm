-- 0002: core tables. RLS is enabled in 0004; default grants are revoked there.

------------------------------------------------------------------ profiles
-- Staff accounts only. One row per Supabase Auth user allowed into /admin.
-- There is intentionally NO auto-create trigger: signup is disabled and the first admin
-- is provisioned explicitly (see docs/ADMIN_PROVISIONING.md).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'editor',
  display_name text not null check (char_length(display_name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

------------------------------------------------------------ author profiles
-- Public-facing scholar/author identity. Content is supplied by the administrator;
-- nothing is pre-filled. Multiple authors are supported for future growth.
create table public.author_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  portrait_media_id uuid, -- FK added after media_assets exists
  email_public text check (email_public is null or email_public ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  social_links jsonb not null default '[]'::jsonb check (jsonb_typeof(social_links) = 'array'),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index author_profiles_one_primary on public.author_profiles (is_primary) where is_primary;

create table public.author_profile_translations (
  author_id uuid not null references public.author_profiles (id) on delete cascade,
  locale public.locale_code not null,
  display_name text not null check (char_length(display_name) between 1 and 200),
  headline text check (char_length(headline) <= 300),
  biography jsonb,       -- validated rich-text document
  education jsonb,
  teaching_activities jsonb,
  seo_description text check (char_length(seo_description) <= 320),
  updated_at timestamptz not null default now(),
  primary key (author_id, locale)
);

------------------------------------------------------------------- media
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  kind public.media_kind not null,
  -- Exactly one of: private storage object, or validated external URL (video provider).
  storage_path text unique,            -- object path in private bucket `media-private`
  public_path text unique,             -- object path in public bucket `media-public`, set only while released
  is_public boolean not null default false, -- true only while attached to publicly visible content
  external_provider text check (external_provider in ('youtube', 'vimeo')),
  external_id text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes between 0 and 2147483648),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  thumbnail_media_id uuid references public.media_assets (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_source_exclusive check (
    (storage_path is not null and external_provider is null and external_id is null)
    or (storage_path is null and external_provider is not null and external_id is not null)
  ),
  constraint media_storage_has_mime check (storage_path is null or mime_type is not null),
  constraint media_public_requires_storage check (public_path is null or storage_path is not null),
  constraint media_public_is_deliverable check (not is_public or external_provider is not null or public_path is not null)
);
create index media_assets_kind_idx on public.media_assets (kind, created_at desc);

create table public.media_asset_translations (
  media_id uuid not null references public.media_assets (id) on delete cascade,
  locale public.locale_code not null,
  title text check (char_length(title) <= 300),
  description text check (char_length(description) <= 4000),
  alt_text text check (char_length(alt_text) <= 500),
  caption text check (char_length(caption) <= 500),
  primary key (media_id, locale)
);

alter table public.author_profiles
  add constraint author_profiles_portrait_fk foreign key (portrait_media_id) references public.media_assets (id) on delete set null;

---------------------------------------------------------------- lessons
-- A lesson is the language-independent identity. Publication status lives on each
-- TRANSLATION (a Hausa version can be public while the English one is still a draft).
-- DESIGN DECISION: no lesson-level status column, to avoid a denormalised value that could disagree.
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.author_profiles (id) on delete set null,
  content_type public.content_type not null default 'article',
  original_locale public.locale_code not null default 'ha',
  is_featured boolean not null default false,
  featured_rank integer check (featured_rank is null or featured_rank >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lessons_featured_idx on public.lessons (featured_rank nulls last) where is_featured;
create index lessons_author_idx on public.lessons (author_id);

create table public.lesson_translations (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  locale public.locale_code not null,
  kind public.translation_kind not null default 'original',
  translator_name text check (char_length(translator_name) <= 200),
  title text not null check (char_length(btrim(title)) between 1 and 300),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 96),
  excerpt text check (char_length(excerpt) <= 1000),
  body jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb
    check (jsonb_typeof(body) = 'object' and body ->> 'type' = 'doc'),
  body_text text not null default '' check (char_length(body_text) <= 2000000), -- plain text derived by the server for search
  seo_title text check (char_length(seo_title) <= 120),
  seo_description text check (char_length(seo_description) <= 320),
  status public.publish_status not null default 'draft',
  published_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  version integer not null default 1, -- optimistic concurrency token for autosave
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_translations_unique_locale unique (lesson_id, locale),
  constraint lesson_translations_unique_slug unique (locale, slug),
  constraint published_requires_date check (status <> 'published' or published_at is not null),
  constraint translation_requires_translator check (kind = 'original' or translator_name is not null),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', public.normalize_search_text(title)), 'A')
    || setweight(to_tsvector('simple', public.normalize_search_text(coalesce(excerpt, ''))), 'B')
    || setweight(to_tsvector('simple', public.normalize_search_text(body_text)), 'C')
  ) stored
);
create index lesson_translations_search_idx on public.lesson_translations using gin (search_vector);
create index lesson_translations_title_trgm on public.lesson_translations using gin (public.normalize_search_text(title) extensions.gin_trgm_ops);
create index lesson_translations_listing_idx on public.lesson_translations (locale, published_at desc) where status = 'published';
create index lesson_translations_status_idx on public.lesson_translations (status, updated_at desc);

------------------------------------------------------ categories and tags
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_parent_idx on public.categories (parent_id, sort_order);

create table public.category_translations (
  category_id uuid not null references public.categories (id) on delete cascade,
  locale public.locale_code not null,
  name text not null check (char_length(btrim(name)) between 1 and 150),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 1000),
  primary key (category_id, locale),
  unique (locale, slug)
);

create table public.lesson_categories (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (lesson_id, category_id)
);
create index lesson_categories_category_idx on public.lesson_categories (category_id);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);
create table public.tag_translations (
  tag_id uuid not null references public.tags (id) on delete cascade,
  locale public.locale_code not null,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  primary key (tag_id, locale)
);
create table public.lesson_tags (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (lesson_id, tag_id)
);
create index lesson_tags_tag_idx on public.lesson_tags (tag_id);

------------------------------------------------- sources and citations
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  source_type public.source_type not null,
  title text not null check (char_length(btrim(title)) between 1 and 400),
  author_or_compiler text check (char_length(author_or_compiler) <= 300),
  original_language text check (char_length(original_language) <= 50),
  publisher text check (char_length(publisher) <= 300),
  edition text check (char_length(edition) <= 200),
  publication_year integer check (publication_year is null or publication_year between 1 and 2200),
  source_url text check (source_url is null or source_url ~* '^https?://'),
  notes text check (char_length(notes) <= 4000),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sources_title_trgm on public.sources using gin (public.normalize_search_text(title) extensions.gin_trgm_ops);

-- A citation of a source from a lesson. Locators are edition-specific and free-form:
-- hadith numbering differs between editions, so nothing is inferred or auto-filled.
create table public.lesson_sources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  source_id uuid not null references public.sources (id) on delete restrict,
  volume text check (char_length(volume) <= 50),
  page text check (char_length(page) <= 50),
  chapter text check (char_length(chapter) <= 300),
  hadith_number text check (char_length(hadith_number) <= 100),
  edition_locator text check (char_length(edition_locator) <= 300),
  quotation text check (char_length(quotation) <= 10000),
  authenticity_grade public.authenticity_grade not null default 'unverified',
  graded_by text check (char_length(graded_by) <= 300),
  editorial_notes text check (char_length(editorial_notes) <= 4000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  -- A grading without a named authority is not publishable. "unverified"/"not_applicable" need none.
  constraint grading_requires_authority check (
    authenticity_grade in ('unverified', 'not_applicable') or nullif(btrim(graded_by), '') is not null
  )
);
create index lesson_sources_lesson_idx on public.lesson_sources (lesson_id, sort_order);
create index lesson_sources_source_idx on public.lesson_sources (source_id);

-------------------------------------------------------------- lesson media
create table public.lesson_media (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  media_id uuid not null references public.media_assets (id) on delete restrict,
  locale public.locale_code,  -- null = applies to every language version
  role public.media_role not null default 'inline',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (lesson_id, media_id, role)
);
create index lesson_media_media_idx on public.lesson_media (media_id);

create table public.related_lessons (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  related_lesson_id uuid not null references public.lessons (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (lesson_id, related_lesson_id),
  check (lesson_id <> related_lesson_id)
);

------------------------------------------------------------------- books
create table public.books (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.author_profiles (id) on delete set null,
  cover_media_id uuid references public.media_assets (id) on delete set null,
  document_media_id uuid references public.media_assets (id) on delete set null, -- only if distribution is authorised
  publication_year integer check (publication_year is null or publication_year between 1 and 2200),
  isbn text check (isbn is null or isbn ~ '^[0-9Xx-]{10,17}$'),
  purchase_url text check (purchase_url is null or purchase_url ~* '^https://'),
  distribution_authorised boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_requires_authorisation check (document_media_id is null or distribution_authorised)
);
create table public.book_translations (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  locale public.locale_code not null,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 8000),
  publisher text check (char_length(publisher) <= 300),
  status public.publish_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (book_id, locale),
  unique (locale, slug),
  constraint book_published_requires_date check (status <> 'published' or published_at is not null)
);

----------------------------------------------------- operations tables
-- Permanent redirects created automatically when a published slug changes.
create table public.url_redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique check (from_path ~ '^/[a-z]{2}/[a-z0-9/_-]*$'),
  to_path text not null check (to_path ~ '^/[a-z]{2}/[a-z0-9/_-]*$' and to_path <> from_path),
  status_code integer not null default 301 check (status_code in (301, 308)),
  created_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key check (key ~ '^[a-z0-9_.-]+$'),
  value jsonb not null,
  is_public boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 150),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  subject text check (char_length(subject) <= 200),
  message text not null check (char_length(btrim(message)) between 5 and 5000),
  locale public.locale_code,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Fixed-window rate limit counters (written only by the server using the service role).
create table public.rate_limits (
  bucket text not null,           -- e.g. "contact:<hashed ip>"
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key (bucket, window_start)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,                 -- not an FK: log must survive account deletion
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

create table public.lesson_revisions (
  id uuid primary key default gen_random_uuid(),
  translation_id uuid not null references public.lesson_translations (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  locale public.locale_code not null,
  version integer not null,
  snapshot jsonb not null,
  change_note text check (char_length(change_note) <= 500),
  created_by uuid,
  created_at timestamptz not null default now()
);
create index lesson_revisions_translation_idx on public.lesson_revisions (translation_id, created_at desc);
