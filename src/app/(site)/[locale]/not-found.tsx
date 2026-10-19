import { headers } from "next/headers";
import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { DEFAULT_LOCALE, isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function NotFound() {
  const h = await headers();
  const raw = h.get("x-locale");
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  return (
    <SiteShell locale={locale}>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold text-deep">{dict.notFound.title}</h1>
        <p className="mt-4 text-mute">{dict.notFound.body}</p>
        <Link href={localePath(locale)} className="ui mt-8 inline-block rounded bg-deep px-5 py-3 text-ivory hover:bg-moss">
          {dict.notFound.back}
        </Link>
      </div>
    </SiteShell>
  );
}
