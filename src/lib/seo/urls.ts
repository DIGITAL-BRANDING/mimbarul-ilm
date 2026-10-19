import { localePath, type Locale } from "@/lib/i18n/config";

export function lessonPath(locale: Locale, slug: string): string {
  return localePath(locale, `/lessons/${slug}`);
}

export function absoluteUrl(siteUrl: string, path: string): string {
  return `${siteUrl.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface Alt {
  locale: Locale;
  slug: string;
}

/**
 * hreflang map for a lesson: ONLY translations that actually exist and are public.
 * x-default points at the original-language version when it is published, else is omitted
 * (we never guess a default).
 */
export function lessonLanguages(alts: Alt[], originalLocale: Locale): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of alts) out[a.locale] = lessonPath(a.locale, a.slug);
  const orig = alts.find((a) => a.locale === originalLocale);
  if (orig) out["x-default"] = lessonPath(orig.locale, orig.slug);
  return out;
}

export function shareLinks(url: string, title: string) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return [
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
    { id: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
    { id: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { id: "x", label: "X", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { id: "email", label: "Email", href: `mailto:?subject=${t}&body=${u}` },
  ];
}
