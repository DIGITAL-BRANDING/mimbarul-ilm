import { createPublicClient } from "@/lib/supabase/public";
import type { Locale } from "@/lib/i18n/config";
import type { AuthorSummary, CategoryListItem, ContentType, LessonListItem } from "@/types/db";

export interface LessonPageItem extends LessonListItem {
  body: unknown;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
  lesson_id: string;
}

export interface SearchResult extends LessonListItem {
  content_type: ContentType;
  rank: number;
  total_count: number;
}

export interface LessonSource {
  id: string;
  title: string;
  author_or_compiler: string | null;
  source_url: string | null;
  volume: string | null;
  page: string | null;
  chapter: string | null;
  hadith_number: string | null;
  edition_locator: string | null;
  authenticity_grade: string | null;
  graded_by: string | null;
  reference_verified: boolean;
}

/**
 * Public-page data access.
 *
 * Failure policy: at RUNTIME a database error is thrown. For ISR pages Next.js then keeps serving the last
 * successfully generated version instead of caching an empty page. During `next build` only, errors are logged and an
 * empty result is used so the project can be built without database access (always build with real credentials in production).
 */
function failSoft(where: string, message: string): void {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    console.error(`[data] ${where} failed during build (empty state used): ${message}`);
    return;
  }
  throw new Error(`[data] ${where} failed: ${message}`);
}

export async function getLatestLessons(locale: Locale, opts: { contentType?: ContentType; limit?: number } = {}): Promise<LessonListItem[]> {
  const supabase = createPublicClient();
  let q = supabase
    .from("lesson_translations")
    .select("id, lesson_id, locale, slug, title, excerpt, published_at, lessons!inner(content_type)")
    .eq("locale", locale)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(opts.limit ?? 6);
  if (opts.contentType) q = q.eq("lessons.content_type", opts.contentType);
  const { data, error } = await q;
  if (error) {
    failSoft("getLatestLessons", error.message);
    return [];
  }
  return (data ?? []) as unknown as LessonListItem[];
}

export async function getTopCategories(locale: Locale): Promise<CategoryListItem[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("category_translations")
    .select("category_id, locale, name, slug, description, categories!inner(sort_order, parent_id)")
    .eq("locale", locale)
    .is("categories.parent_id", null)
    .order("sort_order", { referencedTable: "categories", ascending: true });
  if (error) {
    failSoft("getTopCategories", error.message);
    return [];
  }
  return (data ?? []) as unknown as CategoryListItem[];
}

export async function getPrimaryAuthor(locale: Locale): Promise<AuthorSummary | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("author_profile_translations")
    .select("display_name, headline, author_profiles!inner(is_primary)")
    .eq("locale", locale)
    .eq("author_profiles.is_primary", true)
    .maybeSingle();
  if (error) {
    failSoft("getPrimaryAuthor", error.message);
    return null;
  }
  return data ? { display_name: data.display_name as string, headline: (data.headline as string | null) ?? null } : null;
}

export async function getLessons(
  locale: Locale,
  opts: { contentType?: ContentType; categorySlug?: string; limit?: number; offset?: number } = {},
): Promise<LessonListItem[]> {
  const supabase = createPublicClient();
  const select = opts.categorySlug
    ? "id, lesson_id, locale, slug, title, excerpt, published_at, lessons!inner(content_type, lesson_categories!inner(category_id, categories!inner(category_translations!inner(locale, slug))))"
    : "id, lesson_id, locale, slug, title, excerpt, published_at, lessons!inner(content_type)";
  let query = supabase
    .from("lesson_translations")
    .select(select)
    .eq("locale", locale)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 20) - 1);
  if (opts.contentType) query = query.eq("lessons.content_type", opts.contentType);
  if (opts.categorySlug) query = query.eq("lessons.lesson_categories.categories.category_translations.locale", locale).eq("lessons.lesson_categories.categories.category_translations.slug", opts.categorySlug);
  const { data, error } = await query;
  if (error) {
    failSoft("getLessons", error.message);
    return [];
  }
  return (data ?? []) as unknown as LessonListItem[];
}

export async function getLessonBySlug(locale: Locale, slug: string): Promise<LessonPageItem | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("lesson_translations")
    .select("id, lesson_id, locale, slug, title, excerpt, published_at, body, seo_title, seo_description, updated_at, lessons!inner(content_type)")
    .eq("locale", locale)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (error) {
    failSoft("getLessonBySlug", error.message);
    return null;
  }
  return data as unknown as LessonPageItem | null;
}

export async function getLessonTranslations(lessonId: string): Promise<Array<{ locale: Locale; slug: string }>> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("lesson_translations").select("locale, slug").eq("lesson_id", lessonId)
    .eq("status", "published").lte("published_at", new Date().toISOString());
  if (error) {
    failSoft("getLessonTranslations", error.message);
    return [];
  }
  return (data ?? []) as Array<{ locale: Locale; slug: string }>;
}

export async function getLessonSources(lessonId: string): Promise<LessonSource[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("lesson_sources")
    .select("id, volume, page, chapter, hadith_number, edition_locator, authenticity_grade, graded_by, reference_verified, sources!inner(title, author_or_compiler, source_url)")
    .eq("lesson_id", lessonId);
  if (error) {
    failSoft("getLessonSources", error.message);
    return [];
  }
  return (data ?? []).map((row) => {
    const { sources, ...citation } = row;
    return { ...sources, ...citation };
  }) as unknown as LessonSource[];
}

export async function searchLessons(locale: Locale, query: string, opts: { limit?: number; offset?: number } = {}): Promise<SearchResult[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("search_lessons", {
    q: query,
    p_locale: locale,
    p_content_type: null,
    p_category_id: null,
    p_limit: opts.limit ?? 20,
    p_offset: opts.offset ?? 0,
  });
  if (error) {
    failSoft("searchLessons", error.message);
    return [];
  }
  type SearchRpcRow = {
    translation_id: string;
    lesson_id: string;
    locale: Locale;
    slug: string;
    title: string;
    excerpt: string | null;
    published_at: string;
    content_type: ContentType;
    rank: number;
    total_count: number;
  };
  return ((data ?? []) as unknown as SearchRpcRow[]).map((row) => ({
    id: row.translation_id,
    lesson_id: row.lesson_id,
    locale: row.locale,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    published_at: row.published_at,
    content_type: row.content_type,
    rank: row.rank,
    total_count: Number(row.total_count),
    lessons: { content_type: row.content_type },
  })) as SearchResult[];
}

export async function getPublicLessonUrls(): Promise<Array<{ lesson_id: string; locale: Locale; slug: string; updated_at: string }>> {
  const supabase = createPublicClient();
  const pageSize = 1000;
  const all: Array<{ lesson_id: string; locale: Locale; slug: string; updated_at: string }> = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from("lesson_translations").select("lesson_id, locale, slug, updated_at")
      .eq("status", "published").lte("published_at", new Date().toISOString())
      .order("updated_at", { ascending: false }).range(offset, offset + pageSize - 1);
    if (error) {
      failSoft("getPublicLessonUrls", error.message);
      return [];
    }
    all.push(...(data ?? []) as Array<{ lesson_id: string; locale: Locale; slug: string; updated_at: string }>);
    if ((data?.length ?? 0) < pageSize) return all;
  }
}
