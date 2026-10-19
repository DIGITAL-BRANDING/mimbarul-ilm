import type { Locale } from "@/lib/i18n/config";

const INTL_TAG: Record<Locale, string> = { ha: "ha-NG", ar: "ar", en: "en" };

/** Date shown to readers. UTC so the same date renders on server and client regardless of timezone. */
export function formatDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(INTL_TAG[locale], { dateStyle: "long", timeZone: "UTC" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** JSON-LD must not be able to close its <script> tag. */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
