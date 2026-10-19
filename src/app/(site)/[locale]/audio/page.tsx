import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonList } from "@/components/lessons/LessonList";
import { SiteShell } from "@/components/layout/SiteShell";
import { getLessonList } from "@/lib/data/lessons";
import { getPublicCopy } from "@/lib/i18n/public-copy";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).nav.audio, alternates: { canonical: localePath(locale, "/audio") } } : {};
}

export default async function AudioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const copy = getPublicCopy(raw);
  const result = await getLessonList(raw, { page: 1, q: "", type: "audio", sort: "new", category: null, all: false }, null);
  return <SiteShell locale={raw} path="/audio"><section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <h1 className="text-3xl font-semibold text-deep">{dict.nav.audio}</h1>
    <p className="mt-3 text-mute">{raw === "ha" ? "Saurari darussan da aka wallafa." : raw === "ar" ? "استمع إلى الدروس المنشورة." : "Listen to published lessons."}</p>
    <div className="mt-8">{result.items.length ? <LessonList items={result.items} locale={raw} dict={dict} /> : <p className="rounded border border-dashed border-rule p-8 text-mute">{copy.empty}</p>}</div>
  </section></SiteShell>;
}
