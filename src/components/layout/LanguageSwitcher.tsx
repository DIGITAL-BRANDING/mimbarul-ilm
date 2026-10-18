import Link from "next/link";
import { LOCALE_META, type Locale } from "@/lib/i18n/config";

export interface Alternate {
  locale: Locale;
  href: string;
}

/**
 * Renders links ONLY for versions that actually exist. Callers pass real alternates
 * (e.g. the published translations of a lesson) - never a guessed URL.
 */
export function LanguageSwitcher({ current, alternates, label }: { current: Locale; alternates: Alternate[]; label: string }) {
  const items = alternates.filter((a) => a.locale !== current);
  if (items.length === 0) return null;
  return (
    <nav aria-label={label} className="ui flex items-center gap-1 text-sm">
      {items.map((a) => (
        <Link
          key={a.locale}
          href={a.href}
          hrefLang={a.locale}
          lang={a.locale}
          className="rounded px-2 py-1 hover:bg-white/10 focus-visible:bg-white/10"
        >
          {LOCALE_META[a.locale].nativeName}
        </Link>
      ))}
    </nav>
  );
}
