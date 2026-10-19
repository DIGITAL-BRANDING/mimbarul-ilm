import Link from "next/link";
import { formatDate } from "@/lib/format";
import { LOCALE_META, localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { LessonListItem } from "@/types/db";

/** Row list shared by the listing, search and home pages. `showLocale` marks results from other languages. */
export function LessonList({ items, locale, dict, showLocale = false, headingLevel = 2 }: { items: LessonListItem[]; locale: Locale; dict: Dictionary; showLocale?: boolean; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 3 ? "h3" : "h2";
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {items.map((l) => (
        <li key={l.id}>
          <Link href={localePath(l.locale, `/lessons/${l.slug}`)} hrefLang={l.locale} className="group block py-5">
            <H className="text-xl font-semibold text-deep group-hover:underline" lang={l.locale} dir={LOCALE_META[l.locale].dir}>
              {l.title}
            </H>
            {l.excerpt && (
              <p className="mt-1 max-w-prose text-mute" lang={l.locale} dir={LOCALE_META[l.locale].dir}>
                {l.excerpt}
              </p>
            )}
            <p className="ui mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mute">
              <time dateTime={l.published_at}>{formatDate(l.published_at, locale)}</time>
              {l.lessons?.content_type && l.lessons.content_type !== "article" && <span className="rounded bg-parchment px-2 py-0.5">{dict.types[l.lessons.content_type]}</span>}
              {showLocale && <span className="rounded border border-rule px-2 py-0.5">{LOCALE_META[l.locale].nativeName}</span>}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
