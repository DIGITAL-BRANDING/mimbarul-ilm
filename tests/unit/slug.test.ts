import { describe, expect, it } from "vitest";
import { isValidSlug, slugify } from "@/lib/content/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => expect(slugify("Meaning of Tawhid")).toBe("meaning-of-tawhid"));
  it("maps Hausa hooked letters to base letters", () => expect(slugify("Ma'anar Tauhidi ƙarami ɗan ɓarna")).toBe("maanar-tauhidi-karami-dan-barna"));
  it("strips Latin diacritics", () => expect(slugify("Café Résumé")).toBe("cafe-resume"));
  it("returns empty for Arabic-only titles (needs a human slug)", () => expect(slugify("معنى التوحيد")).toBe(""));
  it("collapses punctuation and trims", () => expect(slugify("  --Hello!!  World--  ")).toBe("hello-world"));
  it("caps length without trailing hyphen", () => {
    const s = slugify("a".repeat(95) + " bbbb");
    expect(s.length).toBeLessThanOrEqual(96);
    expect(s.endsWith("-")).toBe(false);
  });
});

describe("isValidSlug", () => {
  it.each(["abc", "a-b-c", "tawhid-1"])("accepts %s", (s) => expect(isValidSlug(s)).toBe(true));
  it.each(["", "-a", "a-", "a--b", "A", "a b", "a/b", "../x", "ا"])("rejects %j", (s) => expect(isValidSlug(s)).toBe(false));
});
