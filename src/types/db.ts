/**
 * Hand-written row shapes for the columns the app currently selects.
 * TODO: replace with `supabase gen types typescript` output once a project is linked (see docs/PROGRESS.md).
 */
import type { Locale } from "@/lib/i18n/config";
import type { PublishStatus } from "@/lib/content/publishing";

export type ContentType = "article" | "audio" | "video" | "book_commentary";

export interface LessonListItem {
  id: string;
  lesson_id: string;
  locale: Locale;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string;
  lessons: { content_type: ContentType } | null;
}

export interface CategoryListItem {
  category_id: string;
  locale: Locale;
  name: string;
  slug: string;
  description: string | null;
}

export interface AuthorSummary {
  display_name: string;
  headline: string | null;
}

export interface StaffProfile {
  id: string;
  role: "admin" | "editor";
  display_name: string;
}

export type { PublishStatus };
