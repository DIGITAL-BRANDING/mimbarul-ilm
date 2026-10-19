import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { renderDocument } from "@/lib/content/render-document";
import { getPublicAuthor } from "@/lib/data/public";
import { getPublicCopy } from "@/lib/i18n/public-copy";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.nav.about, alternates: { canonical: localePath(locale, "/about") } };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const [author, copy] = await Promise.all([getPublicAuthor(raw), Promise.resolve(getPublicCopy(raw))]);
  const dict = getDictionary(raw);
  const biography = renderDocument(author?.biography, { dict });
  const education = renderDocument(author?.education, { dict });
  const teaching = renderDocument(author?.teaching_activities, { dict });
  return <SiteShell locale={raw} path="/about"><section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <p className="ui text-sm uppercase tracking-[0.18em] text-gold">{dict.nav.about}</p>
    <h1 className="mt-3 text-4xl font-semibold text-deep">{author?.display_name ?? dict.siteName}</h1>
    <p className="mt-3 max-w-2xl text-lg leading-8 text-mute">{author?.headline ?? copy.aboutIntro}</p>
    {biography ? <div className="prose mt-10 max-w-none">{biography}</div> : <p className="mt-10 rounded border border-dashed border-rule bg-parchment/40 p-8 text-mute">{copy.aboutFallback}</p>}
    {(education || teaching) && <div className="mt-10 grid gap-8 sm:grid-cols-2">
      {education && <section><h2 className="text-xl font-semibold text-deep">{raw === "ha" ? "Karatu" : raw === "ar" ? "التعليم" : "Education"}</h2><div className="mt-3">{education}</div></section>}
      {teaching && <section><h2 className="text-xl font-semibold text-deep">{raw === "ha" ? "Ayyukan koyarwa" : raw === "ar" ? "أنشطة التعليم" : "Teaching"}</h2><div className="mt-3">{teaching}</div></section>}
    </div>}
    {author?.email_public && <p className="ui mt-10"><a className="text-gold underline" href={`mailto:${author.email_public}`}>{author.email_public}</a></p>}
  </section></SiteShell>;
}
