import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { searchLessons } from "@/lib/data/public";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).nav.search, robots: { index: false, follow: true } } : {};
}

export default async function SearchPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(raw)) notFound();
  const q = (query.q ?? "").trim().slice(0, 200);
  const results = q ? await searchLessons(raw, q) : [];
  const dict = getDictionary(raw);
  return <SiteShell locale={raw} path="/search"><section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <h1 className="text-3xl font-semibold text-deep">{dict.nav.search}</h1>
    <form action={localePath(raw, "/search")} method="get" role="search" className="mt-6 flex gap-2">
      <label className="sr-only" htmlFor="search-q">{dict.searchPlaceholder}</label>
      <input id="search-q" name="q" type="search" maxLength={200} defaultValue={q} placeholder={dict.searchPlaceholder} className="ui min-w-0 flex-1 rounded border border-rule bg-white px-4 py-3" />
      <button className="ui rounded bg-deep px-5 py-3 font-medium text-ivory" type="submit">{dict.searchButton}</button>
    </form>
    {q && <section className="mt-8" aria-live="polite"><h2 className="mb-4 text-lg font-semibold text-deep">{results.length ? `${results[0]?.total_count ?? 0} — ${q}` : q}</h2>
      {results.length ? <ul className="divide-y divide-rule border-y border-rule">{results.map((lesson) => <li key={lesson.id}>
        <Link className="group block py-5" href={localePath(raw, `/lessons/${lesson.slug}`)}><h3 className="text-xl font-semibold text-deep group-hover:underline">{lesson.title}</h3>
          {lesson.excerpt && <p className="mt-1 text-mute">{lesson.excerpt}</p>}</Link>
      </li>)}</ul> : <p className="rounded border border-dashed border-rule p-6 text-mute">{dict.home.noContentBody}</p>}
    </section>}
  </section></SiteShell>;
}
