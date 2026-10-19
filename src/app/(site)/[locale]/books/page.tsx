import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { getPublishedBooks } from "@/lib/data/public";
import { getPublicCopy } from "@/lib/i18n/public-copy";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).nav.books, alternates: { canonical: localePath(locale, "/books") } } : {};
}

export default async function BooksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const [books, copy] = await Promise.all([getPublishedBooks(raw), Promise.resolve(getPublicCopy(raw))]);
  const dict = getDictionary(raw);
  return <SiteShell locale={raw} path="/books"><section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
    <h1 className="text-3xl font-semibold text-deep">{dict.nav.books}</h1>
    {books.length ? <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{books.map((book) => <li key={book.id} className="flex flex-col rounded border border-rule bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-deep">{book.title}</h2>
      {book.description && <p className="mt-3 flex-1 leading-7 text-mute">{book.description}</p>}
      <dl className="ui mt-5 grid gap-1 text-sm text-mute">{book.publication_year && <div className="flex justify-between gap-3"><dt>{copy.publishedYear}</dt><dd>{book.publication_year}</dd></div>}{book.publisher && <div className="flex justify-between gap-3"><dt>{copy.publisher}</dt><dd>{book.publisher}</dd></div>}</dl>
      {book.purchase_url && <a className="ui mt-5 inline-block text-gold underline" href={book.purchase_url} rel="nofollow noopener noreferrer">{copy.buy}</a>}
    </li>)}</ul> : <p className="mt-8 rounded border border-dashed border-rule p-8 text-mute">{copy.empty}</p>}
  </section></SiteShell>;
}
