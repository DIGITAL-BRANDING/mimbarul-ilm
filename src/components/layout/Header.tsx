import Link from "next/link";
import Image from "next/image";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { LanguageSwitcher, type Alternate } from "./LanguageSwitcher";
import { MobileNav, type NavItem } from "./MobileNav";

export function Header({ locale, dict, alternates }: { locale: Locale; dict: Dictionary; alternates: Alternate[] }) {
  const items: NavItem[] = [
    { href: localePath(locale, "/about"), label: dict.nav.about },
    { href: localePath(locale, "/lessons"), label: dict.nav.lessons },
    { href: localePath(locale, "/audio"), label: dict.nav.audio },
    { href: localePath(locale, "/videos"), label: dict.nav.videos },
    { href: localePath(locale, "/books"), label: dict.nav.books },
    { href: localePath(locale, "/contact"), label: dict.nav.contact },
  ];
  return (
    <header className="relative bg-deep text-ivory">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={localePath(locale)} className="flex items-center gap-3" aria-label={`${dict.siteName} - ${dict.nav.home}`}>
          <Image src="/mimbarul-ilm-logo.png" alt={dict.siteName} width={120} height={120} className="h-12 w-12 rounded-full object-cover" priority />
          <span className="text-xl font-semibold tracking-tight">{dict.siteName}</span>
        </Link>
        <nav aria-label="Main" className="ui hidden items-center gap-1 md:flex">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="rounded px-3 py-2 text-sm hover:bg-white/10">
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher current={locale} alternates={alternates} label={dict.language} />
          <MobileNav items={items} menuLabel={dict.menu} closeLabel={dict.closeMenu} />
        </div>
      </div>
    </header>
  );
}
