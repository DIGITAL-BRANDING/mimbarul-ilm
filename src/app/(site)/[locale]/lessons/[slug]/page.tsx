import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { Citations } from "@/components/lessons/Citations";
import { JsonLd } from "@/components/lessons/JsonLd";
import { LessonList } from "@/components/lessons/LessonList";
import { MediaBlock } from "@/components/lessons/MediaBlock";
import { PrintButton } from "@/components/lessons/PrintButton";
import { SiteShell } from "@/components/layout/SiteShell";
import { collectMediaIds, renderDocument } from "@/lib/content/render-document";
import { getLessonTranslations } from "@/lib/data/public";
import { getCitations, getLessonDetail, getLessonMedia, getLessonTaxonomy, getMediaByIds, getRedirectTarget, getRelatedLessons } from "@/lib/data/lessons";
import { getPublicEnv } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { isLocale, LOCALE_META, localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { absoluteUrl, lessonLanguages, lessonPath, shareLinks } from "@/lib/seo/urls";

export const revalidate = 300;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const lesson = await getLessonDetail(raw, slug);
  if (!lesson) return { robots: { index: false, follow: false } };
  const alts = await getLessonTranslations(lesson.lesson_id);
  const languages = lessonLanguages(alts, lesson.original_locale);
  const description = lesson.seo_description || lesson.excerpt || undefined;
  const title = lesson.seo_title || lesson.title;
  const url = absoluteUrl(getPublicEnv().NEXT_PUBLIC_SITE_URL, lessonPath(raw, slug));
  return {
    title,
    description,
    alternates: { canonical: lessonPath(raw, slug), languages },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: getDictionary(raw).siteName,
      locale: LOCALE_META[raw].ogLocale,
      alternateLocale: alts.filter((a) => a.locale !== raw).map((a) => LOCALE_META[a.locale].ogLocale),
      publishedTime: lesson.published_at,
      modifiedTime: lesson.updated_at,
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function LessonPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const lesson = await getLessonDetail(locale, slug);

  if (!lesson) {
    // A renamed lesson keeps working: the database recorded old -> new when the slug changed.
    const target = await getRedirectTarget(lessonPath(locale, slug));
    if (target) permanentRedirect(target);
    notFound();
  }

  const dict = getDictionary(locale);
  const mediaIds = collectMediaIds(lesson.body);
  const [alts, taxonomy, citations, attached, related, inlineMedia] = await Promise.all([
    getLessonTranslations(lesson.lesson_id),
    getLessonTaxonomy(lesson.lesson_id, locale),
    getCitations(lesson.lesson_id),
    getLessonMedia(lesson.lesson_id, locale),
    getRelatedLessons(lesson.lesson_id, locale),
    getMediaByIds(mediaIds, locale),
  ]);

  const site = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  const url = absoluteUrl(site, lessonPath(locale, slug));
  // Only translations that exist and are public are offered - never a guessed URL.
  const alternates = alts.map((a) => ({ locale: a.locale, href: lessonPath(a.locale, a.slug) }));
  const others = alternates.filter((a) => a.locale !== locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: lesson.title,
    ...(lesson.excerpt ? { description: lesson.excerpt } : {}),
    inLanguage: locale,
    datePublished: lesson.published_at,
    dateModified: lesson.updated_at,
    mainEntityOfPage: url,
    ...(lesson.author_name ? { author: { "@type": "Person", name: lesson.author_name } } : {}),
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: dict.lessons.breadcrumbHome, item: absoluteUrl(site, localePath(locale)) },
      { "@type": "ListItem", position: 2, name: dict.lessons.title, item: absoluteUrl(site, localePath(locale, "/lessons")) },
      { "@type": "ListItem", position: 3, name: lesson.title, item: url },
    ],
  };

  return (
    <SiteShell locale={locale} alternates={alternates}>
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbs} />
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="ui text-sm text-mute">
          <ol className="flex flex-wrap items-center gap-x-2">
            <li>
              <Link className="hover:underline" href={localePath(locale)}>
                {dict.lessons.breadcrumbHome}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link className="hover:underline" href={localePath(locale, "/lessons")}>
                {dict.lessons.title}
              </Link>
            </li>
          </ol>
        </nav>

        <header className="mt-4 border-b border-rule pb-6">
          <h1 className="text-3xl font-semibold leading-tight text-deep sm:text-4xl">{lesson.title}</h1>
          {lesson.excerpt && <p className="mt-4 text-lg leading-8 text-mute">{lesson.excerpt}</p>}
          <p className="ui mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-mute">
            {lesson.author_name && <span>{lesson.author_name}</span>}
            <span>
              {dict.lesson.published}: <time dateTime={lesson.published_at}>{formatDate(lesson.published_at, locale)}</time>
            </span>
            {lesson.updated_at.slice(0, 10) !== lesson.published_at.slice(0, 10) && (
              <span>
                {dict.lesson.updated}: <time dateTime={lesson.updated_at}>{formatDate(lesson.updated_at, locale)}</time>
              </span>
            )}
            {lesson.content_type !== "article" && <span>{dict.types[lesson.content_type]}</span>}
          </p>

          {/* Translations are always distinguishable from original writing. */}
          {lesson.kind === "translation" && (
            <div className="ui mt-4 rounded border border-rule bg-parchment/50 p-3 text-sm">
              {lesson.translator_name && (
                <p>
                  {dict.lessons.translatedBy}: <span dir="auto">{lesson.translator_name}</span>
                </p>
              )}
              <p>
                {dict.lessons.originalLanguage}: <span lang={lesson.original_locale}>{LOCALE_META[lesson.original_locale].nativeName}</span>
              </p>
              <p className={lesson.review_status === "reviewed" ? "text-moss" : "text-mute"}>
                {lesson.review_status === "reviewed" ? dict.lessons.translationReviewed : dict.lessons.translationUnreviewed}
              </p>
            </div>
          )}

          {others.length > 0 && (
            <p className="ui mt-4 text-sm">
              {dict.lesson.availableIn}:{" "}
              {others.map((a, i) => (
                <span key={a.locale}>
                  {i > 0 && " · "}
                  <Link className="text-gold underline" href={a.href} hrefLang={a.locale} lang={a.locale}>
                    {LOCALE_META[a.locale].nativeName}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </header>

        <div className="py-5">{renderDocument(lesson.body, { dict, media: inlineMedia })}</div>

        <MediaBlock items={attached} dict={dict} />
        <Citations citations={citations} dict={dict} />

        {(taxonomy.categories.length > 0 || taxonomy.tags.length > 0) && (
          <section className="ui mt-10 space-y-3 border-t border-rule pt-6 text-sm">
            {taxonomy.categories.length > 0 && (
              <p>
                <span className="font-medium">{dict.lessons.categoriesLabel}:</span>{" "}
                {taxonomy.categories.map((c, i) => (
                  <span key={c.slug}>
                    {i > 0 && " · "}
                    <Link className="text-gold underline" href={`${localePath(locale, "/lessons")}?category=${encodeURIComponent(c.slug)}`}>
                      {c.name}
                    </Link>
                  </span>
                ))}
              </p>
            )}
            {taxonomy.tags.length > 0 && (
              <p>
                <span className="font-medium">{dict.lessons.tagsLabel}:</span> {taxonomy.tags.map((t) => t.name).join(" · ")}
              </p>
            )}
          </section>
        )}

        <section className="no-print ui mt-8 flex flex-wrap items-center gap-2 border-t border-rule pt-6 text-sm" aria-label={dict.lessons.share}>
          <span className="font-medium">{dict.lessons.shareVia}:</span>
          {shareLinks(url, lesson.title).map((s) => (
            <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" className="rounded border border-rule px-3 py-1.5 hover:bg-parchment">
              {s.label}
            </a>
          ))}
          <PrintButton label={dict.lesson.print} />
        </section>

        {related.length > 0 && (
          <section className="no-print mt-12" aria-labelledby="related-title">
            <h2 id="related-title" className="mb-4 text-xl font-semibold text-deep">
              {dict.lesson.related}
            </h2>
            <LessonList items={related} locale={locale} dict={dict} headingLevel={3} />
          </section>
        )}
      </article>
    </SiteShell>
  );
}
