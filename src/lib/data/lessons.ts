import { cache } from "react";
import { getPublicEnv } from "@/lib/env";
import { PAGE_SIZE, type ListParams } from "@/lib/content/list-params";
import type { Locale } from "@/lib/i18n/config";
import { createPublicClient } from "@/lib/supabase/public";
import type { ContentType, LessonListItem } from "@/types/db";

/**
 * Richer public reads used by the lesson, listing and search pages.
 * Everything runs as the anonymous role, so RLS - not this code - guarantees drafts, scheduled items and
 * unpublished translations are never returned. Failure policy matches src/lib/data/public.ts.
 */
function fail(where: string, message: string): void {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    console.error(`[data] ${where} failed during build (empty state used): ${message}`);
    return;
  }
  throw new Error(`[data] ${where} failed: ${message}`);
}
const nowIso = () => new Date().toISOString();

// ---------------------------------------------------------------- lesson page
export interface LessonDetail {
  id: string;
  lesson_id: string;
  locale: Locale;
  slug: string;
  title: string;
  excerpt: string | null;
  body: unknown;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string;
  updated_at: string;
  kind: "original" | "translation";
  translator_name: string | null;
  review_status: "unreviewed" | "reviewed";
  content_type: ContentType;
  original_locale: Locale;
  author_name: string | null;
}

export const getLessonDetail = cache(async (locale: Locale, slug: string): Promise<LessonDetail | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("lesson_translations")
    .select(
      "id, lesson_id, locale, slug, title, excerpt, body, seo_title, seo_description, published_at, updated_at, kind, translator_name, review_status, lessons!inner(content_type, original_locale, author_id)",
    )
    .eq("locale", locale)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", nowIso())
    .maybeSingle();
  if (error) {
    fail("getLessonDetail", error.message);
    return null;
  }
  if (!data) return null;
  const row = data as unknown as Omit<LessonDetail, "content_type" | "original_locale" | "author_name"> & {
    lessons: { content_type: ContentType; original_locale: Locale; author_id: string | null };
  };
  const { lessons, ...rest } = row;
  let author_name: string | null = null;
  if (lessons.author_id) {
    const { data: a } = await supabase
      .from("author_profile_translations")
      .select("display_name, locale")
      .eq("author_id", lessons.author_id);
    const names = (a ?? []) as Array<{ display_name: string; locale: Locale }>;
    author_name = (names.find((n) => n.locale === locale) ?? names.find((n) => n.locale === lessons.original_locale) ?? names[0])?.display_name ?? null;
  }
  return { ...rest, content_type: lessons.content_type, original_locale: lessons.original_locale, author_name };
});

/** Slug-change redirects recorded by the database trigger. Only same-site, locale-prefixed targets are honoured. */
export async function getRedirectTarget(fromPath: string): Promise<string | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("url_redirects").select("to_path").eq("from_path", fromPath).maybeSingle();
  if (error) {
    fail("getRedirectTarget", error.message);
    return null;
  }
  const to = (data as { to_path?: string } | null)?.to_path;
  return to && /^\/(ha|ar|en)\/[a-z0-9/_-]*$/.test(to) ? to : null;
}

export interface Taxonomy {
  categories: Array<{ name: string; slug: string }>;
  tags: Array<{ name: string }>;
}

export async function getLessonTaxonomy(lessonId: string, locale: Locale): Promise<Taxonomy> {
  const supabase = createPublicClient();
  const [cats, tags] = await Promise.all([
    supabase.from("lesson_categories").select("categories!inner(category_translations(locale, name, slug))").eq("lesson_id", lessonId),
    supabase.from("lesson_tags").select("tags!inner(tag_translations(locale, name))").eq("lesson_id", lessonId),
  ]);
  if (cats.error) fail("getLessonTaxonomy.categories", cats.error.message);
  if (tags.error) fail("getLessonTaxonomy.tags", tags.error.message);
  type C = { categories: { category_translations: Array<{ locale: Locale; name: string; slug: string }> } };
  type T = { tags: { tag_translations: Array<{ locale: Locale; name: string }> } };
  return {
    categories: ((cats.data ?? []) as unknown as C[]).flatMap((r) => r.categories.category_translations.filter((t) => t.locale === locale).map((t) => ({ name: t.name, slug: t.slug }))),
    tags: ((tags.data ?? []) as unknown as T[]).flatMap((r) => r.tags.tag_translations.filter((t) => t.locale === locale).map((t) => ({ name: t.name }))),
  };
}

export interface Citation {
  id: string;
  title: string;
  author_or_compiler: string | null;
  edition: string | null;
  publisher: string | null;
  publication_year: number | null;
  source_url: string | null;
  volume: string | null;
  page: string | null;
  chapter: string | null;
  hadith_number: string | null;
  edition_locator: string | null;
  quotation: string | null;
  authenticity_grade: "unverified" | "not_applicable" | "sahih" | "hasan" | "daif" | "mawdu";
  graded_by: string | null;
  reference_verified: boolean;
  editorial_notes: string | null;
}

export async function getCitations(lessonId: string): Promise<Citation[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("lesson_sources")
    .select(
      "id, volume, page, chapter, hadith_number, edition_locator, quotation, authenticity_grade, graded_by, reference_verified, editorial_notes, sort_order, sources!inner(title, author_or_compiler, edition, publisher, publication_year, source_url)",
    )
    .eq("lesson_id", lessonId)
    .order("sort_order", { ascending: true });
  if (error) {
    fail("getCitations", error.message);
    return [];
  }
  return ((data ?? []) as unknown as Array<Record<string, unknown> & { sources: Record<string, unknown> }>).map((row) => {
    const { sources, sort_order: _ignored, ...cite } = row;
    void _ignored;
    return { ...sources, ...cite } as unknown as Citation;
  });
}

// ---------------------------------------------------------------------- media
export interface PublicMedia {
  id: string;
  kind: "image" | "audio" | "video" | "document";
  url: string | null; // storage-backed files
  embedUrl: string | null; // validated video provider embed
  mime_type: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  title: string | null;
  alt_text: string | null;
  caption: string | null;
}

type MediaRow = {
  id: string;
  kind: PublicMedia["kind"];
  storage_provider: "supabase" | "cloudflare_r2" | null;
  storage_path: string | null;
  public_path: string | null;
  external_provider: string | null;
  external_id: string | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  media_asset_translations: Array<{ locale: Locale; title: string | null; alt_text: string | null; caption: string | null }>;
};

const MEDIA_SELECT = "id, kind, storage_provider, storage_path, public_path, external_provider, external_id, mime_type, width, height, duration_seconds, media_asset_translations(locale, title, alt_text, caption)";

function toPublicMedia(row: MediaRow, locale: Locale, embedFor: (p: string, id: string) => string | null): PublicMedia {
  const tr = row.media_asset_translations.find((t) => t.locale === locale) ?? row.media_asset_translations[0];
  const env = getPublicEnv();
  const objectPath = row.public_path ?? row.storage_path;
  const url = row.storage_provider === "cloudflare_r2"
    ? env.NEXT_PUBLIC_MEDIA_CDN_URL && objectPath
      ? `${env.NEXT_PUBLIC_MEDIA_CDN_URL}/${objectPath.split("/").map(encodeURIComponent).join("/")}`
      : null
    : objectPath
      ? `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-public/${objectPath.split("/").map(encodeURIComponent).join("/")}`
      : null;
  const streamUrl = row.external_provider === "cloudflare_stream" && row.external_id && env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE
    ? `https://customer-${env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE}.cloudflarestream.com/${encodeURIComponent(row.external_id)}/iframe`
    : null;
  return {
    id: row.id,
    kind: row.kind,
    url,
    embedUrl: streamUrl ?? (row.external_provider && row.external_id ? embedFor(row.external_provider, row.external_id) : null),
    mime_type: row.mime_type,
    width: row.width,
    height: row.height,
    duration_seconds: row.duration_seconds,
    title: tr?.title ?? null,
    alt_text: tr?.alt_text ?? null,
    caption: tr?.caption ?? null,
  };
}

export async function getMediaByIds(ids: string[], locale: Locale): Promise<Record<string, PublicMedia>> {
  if (ids.length === 0) return {};
  const { embedUrlFor } = await import("@/lib/security/embed");
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("media_assets").select(MEDIA_SELECT).in("id", ids.slice(0, 100));
  if (error) {
    fail("getMediaByIds", error.message);
    return {};
  }
  return Object.fromEntries(((data ?? []) as unknown as MediaRow[]).map((r) => [r.id, toPublicMedia(r, locale, embedUrlFor)]));
}

/** Audio / video / attachments explicitly attached to a lesson (not inline in the body). */
export async function getLessonMedia(lessonId: string, locale: Locale): Promise<PublicMedia[]> {
  const { embedUrlFor } = await import("@/lib/security/embed");
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("lesson_media")
    .select(`role, locale, sort_order, media_assets!inner(${MEDIA_SELECT})`)
    .eq("lesson_id", lessonId)
    .in("role", ["audio", "video"])
    .order("sort_order", { ascending: true });
  if (error) {
    fail("getLessonMedia", error.message);
    return [];
  }
  return ((data ?? []) as unknown as Array<{ locale: Locale | null; media_assets: MediaRow }>)
    .filter((r) => r.locale === null || r.locale === locale)
    .map((r) => toPublicMedia(r.media_assets, locale, embedUrlFor));
}

// -------------------------------------------------------------------- related
export async function getRelatedLessons(lessonId: string, locale: Locale, limit = 4): Promise<LessonListItem[]> {
  const supabase = createPublicClient();
  const rel = await supabase.from("related_lessons").select("related_lesson_id, sort_order").eq("lesson_id", lessonId).order("sort_order", { ascending: true });
  if (rel.error) {
    fail("getRelatedLessons", rel.error.message);
    return [];
  }
  let ids = ((rel.data ?? []) as Array<{ related_lesson_id: string }>).map((r) => r.related_lesson_id);
  if (ids.length === 0) {
    // Fallback: other lessons in the same subject(s).
    const cats = await supabase.from("lesson_categories").select("category_id").eq("lesson_id", lessonId);
    const catIds = ((cats.data ?? []) as Array<{ category_id: string }>).map((c) => c.category_id);
    if (catIds.length === 0) return [];
    const same = await supabase.from("lesson_categories").select("lesson_id").in("category_id", catIds).neq("lesson_id", lessonId).limit(40);
    ids = [...new Set(((same.data ?? []) as Array<{ lesson_id: string }>).map((r) => r.lesson_id))];
  }
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("lesson_translations")
    .select("id, lesson_id, locale, slug, title, excerpt, published_at, lessons!inner(content_type)")
    .in("lesson_id", ids)
    .eq("locale", locale)
    .eq("status", "published")
    .lte("published_at", nowIso())
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) {
    fail("getRelatedLessons.items", error.message);
    return [];
  }
  return (data ?? []) as unknown as LessonListItem[];
}

// ----------------------------------------------------------- listing & search
export interface ListResult {
  items: LessonListItem[];
  total: number;
}

export async function getCategoryOptions(locale: Locale): Promise<Array<{ id: string; name: string; slug: string }>> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("category_translations")
    .select("category_id, name, slug, categories!inner(sort_order)")
    .eq("locale", locale)
    .order("sort_order", { referencedTable: "categories", ascending: true });
  if (error) {
    fail("getCategoryOptions", error.message);
    return [];
  }
  return ((data ?? []) as unknown as Array<{ category_id: string; name: string; slug: string }>).map((c) => ({ id: c.category_id, name: c.name, slug: c.slug }));
}

/**
 * Listing + search in one place.
 *  - with `q`: PostgreSQL full-text search RPC (Hausa/Arabic/English folding), ranked.
 *  - without `q`: chronological browse with optional category/type filters.
 */
export async function getLessonList(locale: Locale, p: ListParams, categoryId: string | null): Promise<ListResult> {
  const supabase = createPublicClient();
  const from = (p.page - 1) * PAGE_SIZE;

  if (p.q) {
    const { data, error } = await supabase.rpc("search_lessons", {
      q: p.q,
      p_locale: p.all ? null : locale,
      p_content_type: p.type,
      p_category_id: categoryId,
      p_limit: PAGE_SIZE,
      p_offset: from,
    });
    if (error) {
      fail("getLessonList.search", error.message);
      return { items: [], total: 0 };
    }
    const rows = (data ?? []) as Array<{ translation_id: string; lesson_id: string; locale: Locale; slug: string; title: string; excerpt: string | null; published_at: string; content_type: ContentType; total_count: number }>;
    return {
      total: Number(rows[0]?.total_count ?? 0),
      items: rows.map((r) => ({ id: r.translation_id, lesson_id: r.lesson_id, locale: r.locale, slug: r.slug, title: r.title, excerpt: r.excerpt, published_at: r.published_at, lessons: { content_type: r.content_type } })),
    };
  }

  const embed = categoryId ? "lessons!inner(content_type, lesson_categories!inner(category_id))" : "lessons!inner(content_type)";
  const columns = `id, lesson_id, locale, slug, title, excerpt, published_at, ${embed}`;
  const base = (head: boolean) => {
    let q = supabase
      .from("lesson_translations")
      .select(columns, { count: "exact", head })
      .eq("locale", locale)
      .eq("status", "published")
      .lte("published_at", nowIso());
    if (p.type) q = q.eq("lessons.content_type", p.type);
    if (categoryId) q = q.eq("lessons.lesson_categories.category_id", categoryId);
    return q;
  };
  const { data, error, count, status } = await base(false)
    .order("published_at", { ascending: p.sort === "old" })
    .range(from, from + PAGE_SIZE - 1);
  if (error) {
    // HTTP 416 / PGRST103: the requested page is beyond the last row. Not a failure: report the real total so the page can
    // clamp. Detected by status code because some PostgREST versions return a truncated error body.
    if (status === 416 || error.code === "PGRST103") {
      const head = await base(true);
      if (!head.error) return { items: [], total: head.count ?? 0 };
    }
    fail("getLessonList", error.message);
    return { items: [], total: 0 };
  }
  return { items: (data ?? []) as unknown as LessonListItem[], total: count ?? 0 };
}
