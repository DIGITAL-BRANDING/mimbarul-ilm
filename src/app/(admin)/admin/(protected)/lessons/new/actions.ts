"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";

const schema = z.object({
  title: z.string().trim().min(1).max(300),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(96),
  locale: z.enum(["ha", "ar", "en"]),
  contentType: z.enum(["article", "audio", "video", "book_commentary"]),
  excerpt: z.string().trim().max(1000),
  bodyText: z.string().max(2_000_000),
  status: z.enum(["draft", "in_review", "published", "archived"]),
});

export type LessonCreateState = { error?: string };

function textToDocument(text: string) {
  const content = text.split(/\r?\n/).map((line) => ({
    type: "paragraph",
    ...(line ? { content: [{ type: "text", text: line }] } : {}),
  }));
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

export async function createLesson(_previous: LessonCreateState, formData: FormData): Promise<LessonCreateState> {
  const parsed = schema.safeParse({
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    locale: String(formData.get("locale") ?? "ha"),
    contentType: String(formData.get("contentType") ?? "article"),
    excerpt: String(formData.get("excerpt") ?? ""),
    bodyText: String(formData.get("bodyText") ?? ""),
    status: String(formData.get("status") ?? "draft"),
  });
  if (!parsed.success) return { error: "Please complete the required fields with valid values." };

  const { supabase } = await requireAdmin();
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .insert({ content_type: parsed.data.contentType, original_locale: parsed.data.locale })
    .select("id")
    .single();
  if (lessonError || !lesson) return { error: lessonError?.message ?? "Unable to create the lesson." };

  const { data: translation, error: translationError } = await supabase
    .from("lesson_translations")
    .insert({
      lesson_id: lesson.id,
      locale: parsed.data.locale,
      kind: "original",
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt || null,
      body: textToDocument(parsed.data.bodyText),
      body_text: parsed.data.bodyText,
      status: parsed.data.status,
    })
    .select("id")
    .single();
  if (translationError || !translation) {
    await supabase.from("lessons").delete().eq("id", lesson.id);
    return { error: translationError?.message ?? "Unable to create the lesson translation." };
  }

  redirect(`/admin/lessons/${translation.id}?created=1`);
}
