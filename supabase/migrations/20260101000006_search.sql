-- 0006: published-content search. SECURITY INVOKER: RLS applies, so drafts can never be returned.
-- Strategy: PostgreSQL full-text ('simple' config, no language stemming) over text that has been run through
-- normalize_search_text() (Arabic diacritics/hamza/yaa folding, Hausa hooked letters), plus trigram-backed
-- substring matching on titles and tag/category names. This avoids English-only stemming assumptions.
create or replace function public.search_lessons(
  q text,
  p_locale public.locale_code default null,
  p_content_type public.content_type default null,
  p_category_id uuid default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  translation_id uuid, lesson_id uuid, locale public.locale_code, slug text, title text,
  excerpt text, published_at timestamptz, content_type public.content_type, rank real, total_count bigint
)
language sql stable security invoker set search_path = public, extensions as $$
  with params as (
    select public.normalize_search_text(left(btrim(coalesce(q, '')), 200)) as nq,
           least(greatest(coalesce(p_limit, 20), 1), 50) as lim,
           greatest(coalesce(p_offset, 0), 0) as off
  ), tsq as (
    select nq, lim, off,
      case when nq = '' then null else websearch_to_tsquery('simple', nq) end as query,
      replace(replace(replace(nq, '\', '\\'), '%', '\%'), '_', '\_') as like_q
    from params
  ), hits as (
    select t.id, t.lesson_id, t.locale, t.slug, t.title, t.excerpt, t.published_at, l.content_type,
      (case when tsq.query is not null then ts_rank_cd(t.search_vector, tsq.query) else 0 end
        + case when public.normalize_search_text(t.title) like '%' || tsq.like_q || '%' then 0.5 else 0 end)::real as rank
    from public.lesson_translations t
    join public.lessons l on l.id = t.lesson_id
    cross join tsq
    where tsq.nq <> ''
      and t.status = 'published' and t.published_at <= now()
      and (p_locale is null or t.locale = p_locale)
      and (p_content_type is null or l.content_type = p_content_type)
      and (p_category_id is null or exists (select 1 from public.lesson_categories lc where lc.lesson_id = l.id and lc.category_id = p_category_id))
      and (
        t.search_vector @@ tsq.query
        or public.normalize_search_text(t.title) like '%' || tsq.like_q || '%'
        or exists (select 1 from public.lesson_tags lt join public.tag_translations tt on tt.tag_id = lt.tag_id
                   where lt.lesson_id = l.id and public.normalize_search_text(tt.name) like '%' || tsq.like_q || '%')
        or exists (select 1 from public.lesson_categories lc join public.category_translations ct on ct.category_id = lc.category_id
                   where lc.lesson_id = l.id and public.normalize_search_text(ct.name) like '%' || tsq.like_q || '%')
        or exists (select 1 from public.lesson_sources ls join public.sources s on s.id = ls.source_id
                   where ls.lesson_id = l.id and public.normalize_search_text(s.title) like '%' || tsq.like_q || '%')
      )
  )
  select h.id, h.lesson_id, h.locale, h.slug, h.title, h.excerpt, h.published_at, h.content_type, h.rank,
         count(*) over () as total_count
  from hits h cross join params
  order by h.rank desc, h.published_at desc
  limit (select lim from params) offset (select off from params)
$$;
grant execute on function public.search_lessons(text, public.locale_code, public.content_type, uuid, integer, integer) to anon, authenticated;
