export const LOCALES = ["ha", "ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ha";

export const LOCALE_META: Record<Locale, { label: string; nativeName: string; dir: "ltr" | "rtl"; ogLocale: string }> = {
  ha: { label: "Hausa", nativeName: "Hausa", dir: "ltr", ogLocale: "ha_NG" },
  ar: { label: "Arabic", nativeName: "العربية", dir: "rtl", ogLocale: "ar_AR" },
  en: { label: "English", nativeName: "English", dir: "ltr", ogLocale: "en_US" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function getDir(locale: Locale): "ltr" | "rtl" {
  return LOCALE_META[locale].dir;
}

/** Build a locale-prefixed path. `path` must start with "/" or be empty. */
export function localePath(locale: Locale, path = ""): string {
  const clean = path === "/" ? "" : path;
  return `/${locale}${clean}`;
}
