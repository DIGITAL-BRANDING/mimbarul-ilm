import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FilterForm } from "@/components/lessons/FilterForm";
import { LessonList } from "@/components/lessons/LessonList";
import { Pagination } from "@/components/lessons/Pagination";
import { SiteShell } from "@/components/layout/SiteShell";
import { buildListHref, parseListParams } from "@/lib/content/list-params";
import { getCategoryOptions, getLessonList } from "@/lib/data/lessons";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  // Search result pages are not indexable (robots.txt also disallows them).
  return isLocale(locale) ? { title: getDictionary(locale).lessons.searchTitle, robots: { index: false, follow: true } } : {};
}

export default async function SearchPage({ params, searchParams }: Props) {
  const [{ locale }, raw] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const p = parseListParams(raw);
  const base = localePath(locale, "/search");

  const categories = await getCategoryOptions(locale);
  const categoryId = p.category ? (categories.find((c) => c.slug === p.category)?.id ?? null) : null;
  const searched = p.q.length > 0;
  const { items, total } = searched && !(p.category && !categoryId) ? await getLessonList(locale, p, categoryId) : { items: [], total: 0 };

  return (
    <SiteShell locale={locale} path="/search">
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold text-deep">{dict.lessons.searchTitle}</h1>
        <div className="mt-6">
          <FilterForm action={base} params={p} categories={categories} dict={dict} showSort={false} />
        </div>

        {!searched && <p className="mt-8 text-mute">{dict.lessons.searchPrompt}</p>}

        {searched && (
          <div className="mt-8">
            <p className="ui text-sm text-mute" aria-live="polite">
              {total} {dict.lessons.results} — <span dir="auto">{p.q}</span>
            </p>
            <p className="ui mt-1 text-sm">
              <Link className="text-gold underline" href={buildListHref(base, { ...p, all: !p.all, page: 1 })}>
                {p.all ? dict.lessons.searchThisLang : dict.lessons.searchAll}
              </Link>
            </p>
            <div className="mt-4">
              {items.length > 0 ? (
                <LessonList items={items} locale={locale} dict={dict} showLocale={p.all} />
              ) : (
                <div className="rounded border border-dashed border-rule bg-parchment/40 p-8">
                  <p className="font-semibold text-deep">{dict.lessons.noResultsTitle}</p>
                  <p className="mt-1 text-mute">{dict.lessons.noResultsBody}</p>
                </div>
              )}
            </div>
            <Pagination base={base} params={p} total={total} dict={dict} />
          </div>
        )}
      </section>
    </SiteShell>
  );
}
