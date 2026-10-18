import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getDir, isLocale, LOCALES, localePath } from "@/lib/i18n/config";

describe("i18n", () => {
  it("validates locales strictly", () => {
    expect(isLocale("ha")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("HA")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
  it("Arabic is RTL; Hausa and English are LTR", () => {
    expect(getDir("ar")).toBe("rtl");
    expect(getDir("ha")).toBe("ltr");
    expect(getDir("en")).toBe("ltr");
  });
  it("builds locale paths", () => {
    expect(localePath("ha")).toBe("/ha");
    expect(localePath("en", "/lessons")).toBe("/en/lessons");
  });
  it("every dictionary has the same keys as English (no missing translations)", () => {
    const keys = (o: object, p = ""): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
    const base = keys(getDictionary("en")).sort();
    for (const l of LOCALES) expect(keys(getDictionary(l)).sort()).toEqual(base);
  });
});
