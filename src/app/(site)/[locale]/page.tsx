import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MinbarMark } from "@/components/layout/MinbarMark";
import { SiteShell } from "@/components/layout/SiteShell";
import { getLatestLessons, getPrimaryAuthor, getTopCategories } from "@/lib/data/public";
import { isLocale, LOCALES, LOCALE_META, localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { LessonListItem } from "@/types/db";

// Scheduled lessons become visible without a deploy: re-generate at most every 5 minutes.
export const revalidate = 300;
// Explicit: uncached data fetches would otherwise silently downgrade this route to fully dynamic rendering.
export const dynamic = "force-static";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: { absolute: `${dict.siteName} | ${dict.motto}` },
    description: dict.motto,
    alternates: {
      canonical: localePath(locale),
      languages: { ...Object.fromEntries(LOCALES.map((l) => [l, localePath(l)])), "x-default": localePath("ha") },
    },
    openGraph: { type: "website", siteName: dict.siteName, title: dict.siteName, description: dict.motto, locale: LOCALE_META[locale].ogLocale },
  };
}

function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "ha" ? "ha-NG" : "en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(iso));
}

function LessonList({ items, locale }: { items: LessonListItem[]; locale: Locale }) {
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {items.map((l) => (
        <li key={l.id}>
          <Link href={localePath(locale, `/lessons/${l.slug}`)} className="group block py-5">
            <h3 className="text-xl font-semibold text-deep group-hover:underline">{l.title}</h3>
            {l.excerpt && <p className="mt-1 max-w-prose text-mute">{l.excerpt}</p>}
            <p className="ui mt-2 text-xs text-mute">
              <time dateTime={l.published_at}>{formatDate(l.published_at, locale)}</time>
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = getDictionary(locale);

  const [author, latest, audio, video, categories] = await Promise.all([
    getPrimaryAuthor(locale),
    getLatestLessons(locale, { limit: 6 }),
    getLatestLessons(locale, { contentType: "audio", limit: 3 }),
    getLatestLessons(locale, { contentType: "video", limit: 3 }),
    getTopCategories(locale),
  ]);

  return (
    <SiteShell locale={locale} path="">
      <section className="bg-deep text-ivory">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            {/* Real author identity only: shown when the administrator has entered it. */}
            {author && <p className="ui text-sm text-gold-bright">{author.display_name}</p>}
            <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">{author?.headline ?? dict.motto}</h1>
            <form action={localePath(locale, "/search")} method="get" role="search" className="mt-8 flex max-w-lg gap-2">
              <label htmlFor="home-q" className="sr-only">
                {dict.searchPlaceholder}
              </label>
              <input
                id="home-q"
                name="q"
                type="search"
                maxLength={200}
                placeholder={dict.searchPlaceholder}
                className="ui min-w-0 flex-1 rounded border border-white/30 bg-white/10 px-4 py-3 text-ivory placeholder:text-ivory/60"
              />
              <button type="submit" className="ui rounded bg-gold-bright px-5 py-3 font-medium text-deep hover:bg-ivory">
                {dict.searchButton}
              </button>
            </form>
          </div>
          <div className="relative hidden select-none md:block" aria-hidden="true">
            <MinbarMark className="absolute -end-4 bottom-0 h-56 w-64 text-moss/60" />
            <p lang="ar" dir="rtl" className="relative text-center font-arabic text-7xl leading-[1.5] text-gold-bright lg:text-8xl">
              منبر العلم
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="pt-14" aria-labelledby="latest-h">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="latest-h" className="text-2xl font-semibold text-deep">
              {dict.home.latest}
            </h2>
            <Link href={localePath(locale, "/lessons")} className="ui text-sm text-gold underline underline-offset-4">
              {dict.home.viewAll}
            </Link>
          </div>
          <div className="mt-5">
            {latest.length > 0 ? (
              <LessonList items={latest} locale={locale} />
            ) : (
              <div className="rounded border border-dashed border-rule bg-parchment/50 p-8">
                <p className="font-semibold text-deep">{dict.home.noContentTitle}</p>
                <p className="mt-1 text-mute">{dict.home.noContentBody}</p>
              </div>
            )}
          </div>
        </section>

        {categories.length > 0 && (
          <section className="pt-14" aria-labelledby="cats-h">
            <h2 id="cats-h" className="text-2xl font-semibold text-deep">
              {dict.home.categories}
            </h2>
            <ul className="mt-5 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <li key={c.category_id} className="border-b border-rule">
                  <Link href={localePath(locale, `/categories/${c.slug}`)} className="block py-3 text-lg text-deep hover:underline">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {audio.length > 0 && (
          <section className="pt-14" aria-labelledby="audio-h">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="audio-h" className="text-2xl font-semibold text-deep">
                {dict.nav.audio}
              </h2>
              <Link href={localePath(locale, "/audio")} className="ui text-sm text-gold underline underline-offset-4">
                {dict.home.viewAll}
              </Link>
            </div>
            <div className="mt-5">
              <LessonList items={audio} locale={locale} />
            </div>
          </section>
        )}

        {video.length > 0 && (
          <section className="pt-14" aria-labelledby="video-h">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="video-h" className="text-2xl font-semibold text-deep">
                {dict.nav.videos}
              </h2>
              <Link href={localePath(locale, "/videos")} className="ui text-sm text-gold underline underline-offset-4">
                {dict.home.viewAll}
              </Link>
            </div>
            <div className="mt-5">
              <LessonList items={video} locale={locale} />
            </div>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
