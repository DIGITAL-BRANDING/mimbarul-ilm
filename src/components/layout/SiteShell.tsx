import { getDictionary } from "@/lib/i18n/dictionaries";
import { LOCALES, localePath, type Locale } from "@/lib/i18n/config";
import { Footer } from "./Footer";
import { Header } from "./Header";
import type { Alternate } from "./LanguageSwitcher";

/**
 * Page chrome. `path` (e.g. "/lessons") is for pages that exist in EVERY locale.
 * Pages whose translations may be missing (a lesson, a book) must pass `alternates` explicitly
 * with only the versions that really exist.
 */
export function SiteShell({
  locale,
  path = "",
  alternates,
  children,
}: {
  locale: Locale;
  path?: string;
  alternates?: Alternate[];
  children: React.ReactNode;
}) {
  const dict = getDictionary(locale);
  const alts = alternates ?? LOCALES.map((l) => ({ locale: l, href: localePath(l, path) }));
  return (
    <>
      <Header locale={locale} dict={dict} alternates={alts} />
      <main id="main">{children}</main>
      <Footer locale={locale} dict={dict} />
    </>
  );
}
