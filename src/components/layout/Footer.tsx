import Link from "next/link";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { MinbarMark } from "./MinbarMark";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const links = [
    { href: localePath(locale, "/about"), label: dict.nav.about },
    { href: localePath(locale, "/lessons"), label: dict.nav.lessons },
    { href: localePath(locale, "/search"), label: dict.nav.search },
    { href: localePath(locale, "/contact"), label: dict.nav.contact },
  ];
  return (
    <footer className="mt-24 bg-deep-2 text-ivory/90">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <MinbarMark className="h-6 w-7 text-gold-bright" />
            <p className="text-lg font-semibold">{dict.siteName}</p>
          </div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ivory/75">{dict.motto}</p>
        </div>
        <nav aria-label={dict.footer.navigation}>
          <h2 className="ui text-sm font-semibold text-gold-bright">{dict.footer.navigation}</h2>
          <ul className="ui mt-3 grid gap-2 text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="ui border-t border-white/10 py-4 text-center text-xs text-ivory/60">
        © {new Date().getFullYear()} {dict.siteName}. {dict.footer.rights}
      </p>
    </footer>
  );
}
