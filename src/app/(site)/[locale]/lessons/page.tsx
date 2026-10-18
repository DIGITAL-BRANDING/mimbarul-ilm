import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { getLessons } from "@/lib/data/public";
import { isLocale, localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { LessonListItem } from "@/types/db";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).nav.lessons, alternates: { canonical: localePath(locale, "/lessons") } };
}

function LessonRows({ items, locale }: { items: LessonListItem[]; locale: Locale }) {
  return <ul className="divide-y divide-rule border-y border-rule">{items.map((item) => <li key={item.id}>
    <Link href={localePath(locale, `/lessons/${item.slug}`)} className="group block py-5">
      <h2 className="text-xl font-semibold text-deep group-hover:underline">{item.title}</h2>
      {item.excerpt && <p className="mt-1 max-w-prose text-mute">{item.excerpt}</p>}
      <time className="ui mt-2 block text-xs text-mute" dateTime={item.published_at}>{new Intl.DateTimeFormat(locale === "ha" ? "ha-NG" : locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(item.published_at))}</time>
    </Link>
  </li>)}</ul>;
}

export default async function LessonsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ page?: string }> }) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(raw)) notFound();
  const page = Math.max(1, Math.min(1000, Number(query.page) || 1));
  const items = await getLessons(raw, { limit: 20, offset: (page - 1) * 20 });
  const dict = getDictionary(raw);
  return <SiteShell locale={raw} path="/lessons"><section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <h1 className="text-3xl font-semibold text-deep">{dict.nav.lessons}</h1>
    <div className="mt-6">{items.length ? <LessonRows items={items} locale={raw} /> : <p className="rounded border border-dashed border-rule p-8 text-mute">{dict.home.noContentBody}</p>}</div>
    {page > 1 && <Link className="ui mt-6 inline-block text-gold underline" href={localePath(raw, `/lessons?page=${page - 1}`)}>← {dict.nav.lessons}</Link>}
    {items.length === 20 && <Link className="ui ms-6 mt-6 inline-block text-gold underline" href={localePath(raw, `/lessons?page=${page + 1}`)}>{dict.home.viewAll} →</Link>}
  </section></SiteShell>;
}
