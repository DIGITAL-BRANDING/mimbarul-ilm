"use client";

import { useActionState } from "react";
import { updateLesson, type LessonEditorState } from "./actions";

type Props = {
  lesson: {
    id: string;
    version: number;
    title: string;
    slug: string;
    excerpt: string | null;
    bodyText: string;
    status: string;
    locale: string;
    contentType: string;
  };
};

const initialState: LessonEditorState = {};

export function LessonEditorForm({ lesson }: Props) {
  const [state, formAction, pending] = useActionState(updateLesson, initialState);
  return (
    <form action={formAction} className="mt-6 grid gap-5 rounded border border-rule bg-ivory p-5 shadow-sm">
      <input type="hidden" name="id" value={lesson.id} />
      <input type="hidden" name="version" value={lesson.version} />
      {state.error && <p role="alert" className="rounded border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">{state.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm text-mute sm:col-span-2">
          Title
          <input name="title" required maxLength={300} defaultValue={lesson.title} className="rounded border border-rule bg-white px-3 py-2 text-ink" />
        </label>
        <label className="grid gap-1 text-sm text-mute">
          Slug
          <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={96} defaultValue={lesson.slug} className="rounded border border-rule bg-white px-3 py-2 text-ink" />
        </label>
        <div className="grid gap-1 text-sm text-mute">
          Locale / type
          <p className="rounded border border-rule bg-parchment px-3 py-2 text-ink">{lesson.locale.toUpperCase()} · {lesson.contentType}</p>
        </div>
        <label className="grid gap-1 text-sm text-mute sm:col-span-2">
          Excerpt
          <textarea name="excerpt" maxLength={1000} rows={3} defaultValue={lesson.excerpt ?? ""} className="rounded border border-rule bg-white px-3 py-2 text-ink" />
        </label>
        <label className="grid gap-1 text-sm text-mute sm:col-span-2">
          Body text
          <textarea name="bodyText" rows={16} defaultValue={lesson.bodyText} className="rounded border border-rule bg-white px-3 py-2 font-mono text-sm text-ink" />
          <span className="text-xs text-mute">Each line becomes a paragraph. Rich editor blocks and media attachments will be added next.</span>
        </label>
        <label className="grid gap-1 text-sm text-mute">
          Status
          <select name="status" defaultValue={lesson.status} className="rounded border border-rule bg-white px-3 py-2 text-ink">
            <option value="draft">Draft</option>
            <option value="in_review">In review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-4">
        <button type="submit" disabled={pending} className="rounded bg-deep px-5 py-2 text-sm text-ivory hover:bg-moss disabled:cursor-wait disabled:opacity-60">
          {pending ? "Saving…" : "Save lesson"}
        </button>
        <span className="text-xs text-mute">Publishing is checked by Supabase RLS and database rules.</span>
      </div>
    </form>
  );
}
