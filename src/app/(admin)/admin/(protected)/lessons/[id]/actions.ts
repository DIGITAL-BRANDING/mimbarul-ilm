"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/session";

const schema = z.object({
  id: z.uuid(),
  version: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(300),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(96),
  excerpt: z.string().trim().max(1000),
  bodyText: z.string().max(2_000_000),
  status: z.enum(["draft", "in_review", "published", "archived"]),
});

export type LessonEditorState = { error?: string };

function textToDocument(text: string) {
  const content = text.split(/\r?\n/).map((line) => ({
    type: "paragraph",
    ...(line ? { content: [{ type: "text", text: line }] } : {}),
  }));
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

export async function updateLesson(_previous: LessonEditorState, formData: FormData): Promise<LessonEditorState> {
  const parsed = schema.safeParse({
    id: String(formData.get("id") ?? ""),
    version: String(formData.get("version") ?? ""),
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    excerpt: String(formData.get("excerpt") ?? ""),
    bodyText: String(formData.get("bodyText") ?? ""),
    status: String(formData.get("status") ?? "draft"),
  });
  if (!parsed.success) return { error: "Please check the title, slug, and content fields." };

  const { supabase } = await requireStaff();
  const { data: current } = await supabase.from("lesson_translations").select("lesson_id, locale, slug").eq("id", parsed.data.id).maybeSingle();
  if (!current) return { error: "This lesson translation no longer exists." };

  const { data: updated, error } = await supabase
    .from("lesson_translations")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt || null,
      body: textToDocument(parsed.data.bodyText),
      body_text: parsed.data.bodyText,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.id)
    .eq("version", parsed.data.version)
    .select("id")
    .maybeSingle();
  if (error) {
    return { error: error.message };
  }
  if (!updated) return { error: "This lesson changed elsewhere. Reload before saving again." };

  revalidatePath(`/[locale]/lessons/${parsed.data.slug}`, "page");
  revalidatePath(`/[locale]/lessons/${current.slug}`, "page");
  revalidatePath("/[locale]/lessons", "page");
  redirect(`/admin/lessons/${parsed.data.id}?saved=1`);
}
