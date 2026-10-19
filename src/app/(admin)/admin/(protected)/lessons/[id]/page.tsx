import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { LessonEditorForm } from "./LessonEditorForm";

export const dynamic = "force-dynamic";

export default async function AdminLessonEditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; created?: string }> }) {
  const { id } = await params;
  const { saved, created } = await searchParams;
  const { supabase } = await requireStaff();
  const { data, error } = await supabase
    .from("lesson_translations")
    .select("id, lesson_id, locale, title, slug, excerpt, body_text, status, version, lessons!inner(content_type)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) notFound();
  const row = data as unknown as {
    id: string;
    locale: string;
    title: string;
    slug: string;
    excerpt: string | null;
    body_text: string;
    status: string;
    version: number;
    lessons: { content_type: string } | Array<{ content_type: string }>;
  };
  const lesson = Array.isArray(row.lessons) ? row.lessons[0] : row.lessons;

  return (
    <div className="max-w-4xl">
      <Link href="/admin/lessons" className="text-sm text-gold underline underline-offset-2">← Back to lessons</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-mute">Lesson translation</p>
          <h1 className="mt-2 text-2xl font-semibold text-deep">Edit lesson</h1>
        </div>
        <span className="text-xs text-mute">Version {row.version}</span>
      </div>
      {saved === "1" && <p role="status" className="mt-4 rounded border border-moss/30 bg-moss/5 px-3 py-2 text-sm text-moss">Lesson saved.</p>}
      {created === "1" && <p role="status" className="mt-4 rounded border border-moss/30 bg-moss/5 px-3 py-2 text-sm text-moss">Lesson created. Review it before publishing.</p>}
      <LessonEditorForm lesson={{ ...row, bodyText: row.body_text, contentType: lesson?.content_type ?? "article" }} />
    </div>
  );
}
