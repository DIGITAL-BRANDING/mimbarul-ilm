"use client";

import { useActionState } from "react";
import { createLesson, type LessonCreateState } from "./actions";

const initialState: LessonCreateState = {};

export function LessonCreateForm() {
  const [state, formAction, pending] = useActionState(createLesson, initialState);
  return (
    <form action={formAction} className="mt-6 grid gap-5 rounded border border-rule bg-ivory p-5 shadow-sm">
      {state.error && <p role="alert" className="rounded border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">{state.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm text-mute sm:col-span-2">
          Title
          <input name="title" required maxLength={300} className="rounded border border-rule bg-white px-3 py-2 text-ink" />
        </label>
        <label className="grid gap-1 text-sm text-mute">
          Slug
          <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={96} placeholder="karfin-imani" className="rounded border border-rule bg-white px-3 py-2 text-ink" />
        </label>
        <label className="grid gap-1 text-sm text-mute">
          Locale
          <select name="locale" defaultValue="ha" className="rounded border border-rule bg-white px-3 py-2 text-ink">
            <option value="ha">Hausa</option>
            <option value="ar">Arabic</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm text-mute">
          Content type
          <select name="contentType" defaultValue="article" className="rounded border border-rule bg-white px-3 py-2 text-ink">
            <option value="article">Article</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
            <option value="book_commentary">Book commentary</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm text-mute">
          Initial status
          <select name="status" defaultValue="draft" className="rounded border border-rule bg-white px-3 py-2 text-ink">
            <option value="draft">Draft</option>
            <option value="in_review">In review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm text-mute sm:col-span-2">
          Excerpt
          <textarea name="excerpt" maxLength={1000} rows={3} className="rounded border border-rule bg-white px-3 py-2 text-ink" />
        </label>
        <label className="grid gap-1 text-sm text-mute sm:col-span-2">
          Body text
          <textarea name="bodyText" rows={16} className="rounded border border-rule bg-white px-3 py-2 font-mono text-sm text-ink" />
          <span className="text-xs text-mute">Each line becomes a paragraph. Add an excerpt and body before publishing.</span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-4">
        <button type="submit" disabled={pending} className="rounded bg-deep px-5 py-2 text-sm text-ivory hover:bg-moss disabled:cursor-wait disabled:opacity-60">
          {pending ? "Creating…" : "Create lesson"}
        </button>
        <span className="text-xs text-mute">Only administrators can create and publish lessons.</span>
      </div>
    </form>
  );
}
