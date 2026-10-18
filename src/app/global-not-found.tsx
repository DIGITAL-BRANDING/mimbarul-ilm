import { headers } from "next/headers";
import Link from "next/link";
import "@fontsource-variable/noto-serif/wght.css";
import "@fontsource/amiri/arabic-400.css";
import "./globals.css";
import { DEFAULT_LOCALE, getDir, isLocale, localePath } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

/**
 * Handles every 404 (unmatched URL, or notFound() from any page). It must render its own <html>.
 * src/proxy.ts forwards the URL's locale in the x-locale request header, so the message is localized.
 */
export const metadata = { title: "404", robots: { index: false, follow: false } };

export default async function GlobalNotFound() {
  const raw = (await headers()).get("x-locale");
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  return (
    <html lang={locale} dir={getDir(locale)}>
      <body className="grid min-h-dvh place-items-center bg-ivory px-4 text-center antialiased">
        <div className="max-w-xl">
          <h1 className="text-3xl font-semibold text-deep">{dict.notFound.title}</h1>
          <p className="mt-4 text-mute">{dict.notFound.body}</p>
          <Link href={localePath(locale)} className="ui mt-8 inline-block rounded bg-deep px-5 py-3 text-ivory hover:bg-moss">
            {dict.notFound.back}
          </Link>
        </div>
      </body>
    </html>
  );
}
