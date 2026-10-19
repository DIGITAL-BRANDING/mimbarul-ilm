import { describe, expect, it } from "vitest";
import { buildListHref, hasActiveFilters, parseListParams } from "@/lib/content/list-params";
import { formatDate, safeJsonLd } from "@/lib/format";
import { lessonLanguages, shareLinks } from "@/lib/seo/urls";
import { embedUrlFor } from "@/lib/security/embed";

describe("parseListParams", () => {
  it("applies safe defaults", () => expect(parseListParams({})).toEqual({ q: "", category: null, type: null, sort: "new", page: 1, all: false }));
  it("clamps page", () => {
    expect(parseListParams({ page: "-5" }).page).toBe(1);
    expect(parseListParams({ page: "abc" }).page).toBe(1);
    expect(parseListParams({ page: "999999" }).page).toBe(500);
    expect(parseListParams({ page: "3" }).page).toBe(3);
  });
  it("rejects unknown types and malformed category slugs", () => {
    expect(parseListParams({ type: "malware" }).type).toBeNull();
    expect(parseListParams({ type: "audio" }).type).toBe("audio");
    expect(parseListParams({ category: "../../etc" }).category).toBeNull();
    expect(parseListParams({ category: "hadith" }).category).toBe("hadith");
  });
  it("sanitises and truncates q (control chars, whitespace, length)", () => {
    expect(parseListParams({ q: "  a\u0000b\n\tc  " }).q).toBe("a b c");
    expect(parseListParams({ q: "x".repeat(500) }).q.length).toBe(200);
  });
  it("keeps Arabic with diacritics intact", () => expect(parseListParams({ q: "الْأَعْمَالُ" }).q).toBe("الْأَعْمَالُ"));
  it("takes the first value of repeated params", () => expect(parseListParams({ page: ["2", "9"] }).page).toBe(2));
});

describe("buildListHref", () => {
  it("omits defaults", () => expect(buildListHref("/ha/lessons", { page: 1, sort: "new" })).toBe("/ha/lessons"));
  it("encodes values", () => expect(buildListHref("/ha/lessons", { q: "a&b=c", page: 2 })).toBe("/ha/lessons?q=a%26b%3Dc&page=2"));
  it("reports active filters", () => {
    expect(hasActiveFilters(parseListParams({}))).toBe(false);
    expect(hasActiveFilters(parseListParams({ sort: "old" }))).toBe(true);
  });
});

describe("lessonLanguages (hreflang)", () => {
  it("lists only existing translations and uses the original as x-default", () => {
    const r = lessonLanguages([{ locale: "ha", slug: "a" }, { locale: "en", slug: "b" }], "ha");
    expect(r).toEqual({ ha: "/ha/lessons/a", en: "/en/lessons/b", "x-default": "/ha/lessons/a" });
    expect("ar" in r).toBe(false);
  });
  it("omits x-default when the original is not published", () => {
    expect(lessonLanguages([{ locale: "en", slug: "b" }], "ha")["x-default"]).toBeUndefined();
  });
});

describe("misc helpers", () => {
  it("safeJsonLd cannot close a script tag", () => expect(safeJsonLd({ a: "</script><script>alert(1)" })).not.toContain("</script"));
  it("formatDate is stable and tolerates bad input", () => {
    expect(formatDate("2026-05-01T23:59:00Z", "en")).toContain("2026");
    expect(formatDate("nonsense", "en")).toBe("");
  });
  it("share links encode the URL", () => expect(shareLinks("https://x.test/a?b=1&c=2", "T & U")[0]?.href).toContain("https%3A%2F%2Fx.test%2Fa%3Fb%3D1%26c%3D2"));
  it("embedUrlFor re-validates ids", () => {
    expect(embedUrlFor("youtube", "dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(embedUrlFor("youtube", '"><script>')).toBeNull();
    expect(embedUrlFor("evil", "123456789")).toBeNull();
  });
});
