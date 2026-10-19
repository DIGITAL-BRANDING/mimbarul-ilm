import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";

const STATUSES = ["", "draft", "in_review", "published", "archived"] as const;
const LOCALES = ["", "ha", "ar", "en"] as const;

type Props = {
  searchParams: Promise<{ q?: string; status?: string; locale?: string }>;
};

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export default async function AdminLessonsPage({ searchParams }: Props) {
  const { supabase, profile } = await requireStaff();
  const raw = await searchParams;
  const q = (raw.q ?? "").trim();
  const status = STATUSES.includes(raw.status as (typeof STATUSES)[number]) ? (raw.status ?? "") : "";
  const locale = LOCALES.includes(raw.locale as (typeof LOCALES)[number]) ? (raw.locale ?? "") : "";

  let query = supabase
    .from("lesson_translations")
    .select("id, lesson_id, locale, title, slug, status, updated_at, lessons!inner(content_type, original_locale)")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);
  if (locale) query = query.eq("locale", locale);
  if (q) query = query.ilike("title", `%${q}%`);
  const { data, error } = await query;
  const rows = (data ?? []) as Array<{
    id: string;
    lesson_id: string;
    locale: string;
    title: string;
    slug: string;
    status: string;
    updated_at: string;
    lessons: { content_type: string; original_locale: string } | Array<{ content_type: string; original_locale: string }>;
  }>;

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-mute">Content management</p>
          <h1 className="mt-2 text-2xl font-semibold text-deep">Lessons</h1>
          <p className="mt-1 text-sm text-mute">Review every lesson translation and its publication state.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded bg-parchment px-3 py-2 text-sm text-mute">{rows.length} shown</span>
          {profile.role === "admin" && <Link href="/admin/lessons/new" className="rounded bg-deep px-4 py-2 text-sm text-ivory hover:bg-moss">New lesson</Link>}
        </div>
      </div>

      <form method="get" className="mt-6 grid gap-3 rounded border border-rule bg-ivory p-4 sm:grid-cols-[1fr_10rem_10rem_auto] sm:items-end">
        <label className="grid gap-1 text-sm text-mute">
          Search title
          <input name="q" defaultValue={q} placeholder="e.g. iman" className="rounded border border-rule bg-white px-3 py-2 text-ink" />
        </label>
        <label className="grid gap-1 text-sm text-mute">
          Status
          <select name="status" defaultValue={status} className="rounded border border-rule bg-white px-3 py-2 text-ink">
            <option value="">All statuses</option>
            {STATUSES.filter(Boolean).map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm text-mute">
          Locale
          <select name="locale" defaultValue={locale} className="rounded border border-rule bg-white px-3 py-2 text-ink">
            <option value="">All locales</option>
            {LOCALES.filter(Boolean).map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded bg-deep px-4 py-2 text-sm text-ivory hover:bg-moss">Filter</button>
      </form>

      {error ? (
        <p role="alert" className="mt-6 rounded border border-danger/40 bg-danger/5 p-4 text-sm text-danger">
          Unable to load lessons: {error.message}
        </p>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded border border-dashed border-rule bg-ivory p-8 text-center text-sm text-mute">
          No lesson translations match these filters.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded border border-rule bg-ivory">
          <table className="w-full min-w-[50rem] border-collapse text-left text-sm">
            <thead className="border-b border-rule bg-parchment text-xs uppercase tracking-wide text-mute">
              <tr>
                <th scope="col" className="px-4 py-3">Title</th>
                <th scope="col" className="px-4 py-3">Locale</th>
                <th scope="col" className="px-4 py-3">Type</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Updated</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-parchment/40">
                  <td className="max-w-md px-4 py-3">
                    <div className="truncate font-medium text-deep">{row.title}</div>
                    <div className="truncate text-xs text-mute">/{row.slug}</div>
                  </td>
                  <td className="px-4 py-3 uppercase text-mute">{row.locale}</td>
                  <td className="px-4 py-3 text-mute">{(Array.isArray(row.lessons) ? row.lessons[0] : row.lessons)?.content_type ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-parchment px-2 py-1 text-xs capitalize text-deep">{row.status.replace("_", " ")}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-mute">{formatDate(row.updated_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/lessons/${row.id}`} className="text-gold underline underline-offset-2">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
