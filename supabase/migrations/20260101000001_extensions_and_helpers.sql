-- 0001: extensions, enums, and search-normalisation helper.
create extension if not exists pg_trgm with schema extensions;

create type public.locale_code as enum ('ha', 'ar', 'en');
create type public.user_role as enum ('admin', 'editor');
create type public.publish_status as enum ('draft', 'in_review', 'published', 'archived');
create type public.content_type as enum ('article', 'audio', 'video', 'book_commentary');
create type public.translation_kind as enum ('original', 'translation');
create type public.source_type as enum ('quran', 'hadith_collection', 'scholarly_book', 'scholar_lecture', 'other');
create type public.authenticity_grade as enum ('unverified', 'not_applicable', 'sahih', 'hasan', 'daif', 'mawdu');
create type public.media_kind as enum ('image', 'audio', 'video', 'document');
create type public.media_role as enum ('inline', 'featured_image', 'audio', 'video', 'attachment');

-- Normalises text for search in Hausa, Arabic and English:
--  * strips Arabic harakat/tashkeel, tatweel and Quranic annotation marks
--  * unifies alef/yaa/taa-marbuta/waw-hamza variants
--  * maps Arabic-Indic digits to ASCII
--  * folds Hausa hooked letters (ɓ ɗ ƙ ƴ) and Latin accents so "kasa" finds "ƙasa"
-- IMMUTABLE so it can back an index / generated column. Requires a UTF8 database.
create or replace function public.normalize_search_text(input text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(
    translate(
      regexp_replace(
        regexp_replace(normalize(coalesce(input, ''), NFD), '[\u0300-\u036f]', '', 'g'),
        '[\u064B-\u065F\u0670\u0640\u06D6-\u06ED]', '', 'g'),
      'أإآٱىةؤئɓɗƙƴƁƊƘƳ٠١٢٣٤٥٦٧٨٩',
      'اااايهويbdkybdky0123456789'
    )
  )
$$;
