import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { renderDocument } from "@/lib/content/render-document";
import { getLessonBySlug, getLessonSources, getLessonTranslations } from "@/lib/data/public";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const lesson = await getLessonBySlug(raw, slug);
  if (!lesson) return {};
  const translations = await getLessonTranslations(lesson.lesson_id);
  const title = lesson.seo_title || lesson.title;
  return {
    title,
    description: lesson.seo_description || lesson.excerpt || undefined,
    alternates: {
      canonical: localePath(raw, `/lessons/${slug}`),
      languages: Object.fromEntries(translations.map((translation) => [translation.locale, localePath(translation.locale, `/lessons/${translation.slug}`)])),
    },
  };
}

export default async function LessonPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const lesson = await getLessonBySlug(raw, slug);
  if (!lesson) notFound();
  const [translations, sources] = await Promise.all([getLessonTranslations(lesson.lesson_id), getLessonSources(lesson.lesson_id)]);
  const dict = getDictionary(raw);
  return <SiteShell locale={raw} alternates={translations.map((translation) => ({ locale: translation.locale, href: localePath(translation.locale, `/lessons/${translation.slug}`) }))}>
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="border-b border-rule pb-6"><h1 className="text-3xl font-semibold leading-tight text-deep sm:text-4xl">{lesson.title}</h1>
        {lesson.excerpt && <p className="mt-4 text-lg leading-8 text-mute">{lesson.excerpt}</p>}
        <time className="ui mt-4 block text-sm text-mute" dateTime={lesson.published_at}>{dict.lesson.published}: {new Intl.DateTimeFormat(raw === "ha" ? "ha-NG" : raw, { dateStyle: "long", timeZone: "UTC" }).format(new Date(lesson.published_at))}</time>
      </header>
      <div className="py-5">{renderDocument(lesson.body)}</div>
      {sources.length > 0 && <section className="mt-10 border-t border-rule pt-6" aria-labelledby="sources-title"><h2 id="sources-title" className="text-xl font-semibold text-deep">{dict.lesson.sources}</h2>
        <ol className="mt-4 list-decimal space-y-3 ps-6">{sources.map((source) => <li key={source.id}>
          {source.source_url ? <a className="text-gold underline" href={source.source_url} rel="nofollow noopener noreferrer">{source.title}</a> : <span>{source.title}</span>}
          {source.author_or_compiler && <span> — {source.author_or_compiler}</span>}
          {(source.volume || source.page || source.chapter || source.hadith_number || source.edition_locator) && <span className="text-mute"> ({[source.volume, source.page, source.chapter, source.hadith_number, source.edition_locator].filter(Boolean).join(", ")})</span>}
          {source.authenticity_grade && <span className="ui text-sm text-mute"> — {source.authenticity_grade}</span>}
        </li>)}</ol>
      </section>}
    </article>
  </SiteShell>;
}
