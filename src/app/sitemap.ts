import type { MetadataRoute } from "next";
import { getPublicLessonUrls } from "@/lib/data/public";
import { getPublicEnv } from "@/lib/env";
import { LOCALES, localePath } from "@/lib/i18n/config";
import { lessonPath } from "@/lib/seo/urls";

export const revalidate = 3600;

/** Public, indexable URLs only: localized home + lesson index, and published translations with reciprocal alternates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  const abs = (p: string) => `${base}${p}`;
  const languagesFor = (path: string) => ({ languages: Object.fromEntries(LOCALES.map((l) => [l, abs(localePath(l, path))])) });

  const entries: MetadataRoute.Sitemap = [
    ...LOCALES.map((l) => ({ url: abs(localePath(l)), changeFrequency: "weekly" as const, priority: 1, alternates: languagesFor("") })),
    ...LOCALES.map((l) => ({ url: abs(localePath(l, "/lessons")), changeFrequency: "daily" as const, priority: 0.8, alternates: languagesFor("/lessons") })),
  ];

  const rows = await getPublicLessonUrls();
  const byLesson = new Map<string, typeof rows>();
  for (const r of rows) byLesson.set(r.lesson_id, [...(byLesson.get(r.lesson_id) ?? []), r]);

  for (const group of byLesson.values()) {
    // hreflang alternates list ONLY the translations that exist and are public.
    const languages = Object.fromEntries(group.map((r) => [r.locale, abs(lessonPath(r.locale, r.slug))]));
    for (const r of group) {
      entries.push({
        url: abs(lessonPath(r.locale, r.slug)),
        lastModified: new Date(r.updated_at),
        changeFrequency: "monthly",
        priority: 0.7,
        ...(group.length > 1 ? { alternates: { languages } } : {}),
      });
    }
  }
  return entries;
}
