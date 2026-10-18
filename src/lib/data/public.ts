import { createPublicClient } from "@/lib/supabase/public";
import type { Locale } from "@/lib/i18n/config";
import type { AuthorSummary, CategoryListItem, ContentType, LessonListItem } from "@/types/db";

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
