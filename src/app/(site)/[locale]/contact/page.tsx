import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { getPublicCopy } from "@/lib/i18n/public-copy";
import { isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ContactForm } from "./ContactForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).nav.contact, alternates: { canonical: localePath(locale, "/contact") } } : {};
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const copy = getPublicCopy(raw);
  const dict = getDictionary(raw);
  return <SiteShell locale={raw} path="/contact"><section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
    <h1 className="text-3xl font-semibold text-deep">{dict.nav.contact}</h1>
    <p className="mt-3 text-lg leading-8 text-mute">{copy.contactIntro}</p>
    <ContactForm locale={raw} copy={copy} />
  </section></SiteShell>;
}
