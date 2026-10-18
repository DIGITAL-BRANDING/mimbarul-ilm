import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/noto-serif/wght.css";
import "@fontsource-variable/noto-serif/wght-italic.css";
import "@fontsource/amiri/arabic-400.css";
import "@fontsource/amiri/arabic-700.css";
import "../../globals.css";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getDir, isLocale, LOCALES } from "@/lib/i18n/config";
import { getPublicEnv } from "@/lib/env";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL(getPublicEnv().NEXT_PUBLIC_SITE_URL),
    title: { default: `${dict.siteName} | ${dict.motto}`, template: `%s | ${dict.siteName}` },
    description: dict.motto,
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = getDictionary(locale);

  return (
    <html lang={locale} dir={getDir(locale)}>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="ui sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-ivory focus:px-4 focus:py-2 focus:text-deep">
          {dict.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
