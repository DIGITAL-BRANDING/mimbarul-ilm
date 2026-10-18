import type { MetadataRoute } from "next";
import { getPublicLessonUrls } from "@/lib/data/public";
import { LOCALES, localePath } from "@/lib/i18n/config";
import { getPublicEnv } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  const entries: MetadataRoute.Sitemap = LOCALES.map((locale) => ({ url: `${base}${localePath(locale)}`, changeFrequency: "weekly", priority: 1 }));
  for (const locale of LOCALES) entries.push({ url: `${base}${localePath(locale, "/lessons")}`, changeFrequency: "daily", priority: 0.8 });
  const lessons = await getPublicLessonUrls();
  for (const lesson of lessons) entries.push({
    url: `${base}${localePath(lesson.locale, `/lessons/${lesson.slug}`)}`,
    lastModified: new Date(lesson.updated_at),
    changeFrequency: "monthly",
    priority: 0.7,
  });
  return entries;
}
