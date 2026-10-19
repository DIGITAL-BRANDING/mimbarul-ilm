import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FilterForm } from "@/components/lessons/FilterForm";
import { LessonList } from "@/components/lessons/LessonList";
import { Pagination } from "@/components/lessons/Pagination";
import { SiteShell } from "@/components/layout/SiteShell";
import { buildListHref, hasActiveFilters, PAGE_SIZE, parseListParams } from "@/lib/content/list-params";
import { getCategoryOptions, getLessonList } from "@/lib/data/lessons";
import { isLocale, LOCALES, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const p = parseListParams(await searchParams);
  const base = localePath(locale, "/lessons");
  return {
    title: getDictionary(locale).lessons.title,
    // Filtered/search variants are for people, not the index; plain pagination stays indexable.
    robots: hasActiveFilters(p) ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: buildListHref(base, { page: p.page }),
      languages: Object.fromEntries(LOCALES.map((l) => [l, localePath(l, "/lessons")])),
    },
  };
}

export default async function LessonsPage({ params, searchParams }: Props) {
  const [{ locale }, raw] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  let p = parseListParams(raw);
  const base = localePath(locale, "/lessons");

  const categories = await getCategoryOptions(locale);
  const categoryId = p.category ? (categories.find((c) => c.slug === p.category)?.id ?? null) : null;
  // An unknown category slug yields an empty result rather than silently ignoring the filter.
  let { items, total } = p.category && !categoryId ? { items: [], total: 0 } : await getLessonList(locale, p, categoryId);

  // A page past the end (old bookmark, edited URL) shows the real last page instead of an empty list.
  // Rendered in place (not redirect()): this route streams behind loading.tsx, so a redirect would be a soft, status-200 one.
  let clamped = false;
  if (items.length === 0 && total > 0 && p.page > 1) {
    p = { ...p, page: Math.ceil(total / PAGE_SIZE) };
    ({ items, total } = await getLessonList(locale, p, categoryId));
    clamped = true;
  }

  return (
    <SiteShell locale={locale} path="/lessons">
      {clamped && <meta name="robots" content="noindex, follow" />}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold text-deep">{dict.lessons.title}</h1>
        <div className="mt-6">
          <FilterForm action={base} params={p} categories={categories} dict={dict} />
        </div>
        <p className="ui mt-6 text-sm text-mute" aria-live="polite">
          {total} {dict.lessons.results}
        </p>
        <div className="mt-3">
          {items.length > 0 ? (
            <LessonList items={items} locale={locale} dict={dict} />
          ) : (
            <div className="rounded border border-dashed border-rule bg-parchment/40 p-8">
              <p className="font-semibold text-deep">{dict.lessons.noResultsTitle}</p>
              <p className="mt-1 text-mute">{dict.lessons.noResultsBody}</p>
            </div>
          )}
        </div>
        <Pagination base={base} params={p} total={total} dict={dict} />
      </section>
    </SiteShell>
  );
}
