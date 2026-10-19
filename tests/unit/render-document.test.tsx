import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { collectMediaIds, renderDocument } from "@/lib/content/render-document";
import { Citations } from "@/components/lessons/Citations";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Citation, PublicMedia } from "@/lib/data/lessons";

const html = (doc: unknown, ctx = {}) => renderToStaticMarkup(<>{renderDocument(doc, ctx)}</>);
const p = (text: string, attrs?: object) => ({ type: "paragraph", ...(attrs ? { attrs } : {}), content: [{ type: "text", text }] });
const doc = (...content: object[]) => ({ type: "doc", content });
const ha = getDictionary("ha");

describe("renderDocument: direction and language", () => {
  it("defaults to dir=auto so Arabic inside Hausa text flips by itself", () => {
    expect(html(doc(p("Sannu")))).toContain('<p dir="auto"');
  });
  it("keeps explicit rtl + lang", () => {
    const out = html(doc(p("إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ", { dir: "rtl", lang: "ar" })));
    expect(out).toContain('lang="ar"');
    expect(out).toContain('dir="rtl"');
    expect(out).toContain("إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ"); // diacritics preserved byte for byte
  });
});

describe("renderDocument: religious text blocks", () => {
  const hadith = { type: "blockquote", attrs: { kind: "hadith", dir: "rtl", lang: "ar" }, content: [p("نص")] };
  it("labels the block kind in the reader's language", () => {
    const out = html(doc(hadith), { dict: ha });
    expect(out).toContain('data-kind="hadith"');
    expect(out).toContain(ha.quoteKinds.hadith);
    expect(html(doc(hadith), { dict: getDictionary("ar") })).toContain("حديث");
  });
  it("renders without a label when no dictionary is given (never invents one)", () => {
    expect(html(doc(hadith))).not.toContain("Hadisi");
  });
});

describe("renderDocument: security", () => {
  it("escapes raw HTML typed as text", () => {
    const out = html(doc(p('<img src=x onerror=alert(1)><script>alert(2)</script>')));
    expect(out).not.toContain("<img");
    expect(out).not.toContain("<script");
    expect(out).toContain("&lt;img");
  });
  it("refuses the WHOLE document if it contains an unsafe link", () => {
    const bad = doc({ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] });
    expect(html(bad)).toBe("");
  });
  it("refuses unknown node types", () => {
    expect(html(doc({ type: "iframe", attrs: { src: "https://evil.example" } }))).toBe("");
  });
  it("marks external links noopener/noreferrer/nofollow", () => {
    const d = doc({ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "https://example.com" } }] }] });
    expect(html(d)).toMatch(/rel="nofollow noopener noreferrer"/);
  });
  it("renders formatting marks", () => {
    const d = doc({ type: "paragraph", content: [{ type: "text", text: "b", marks: [{ type: "bold" }, { type: "italic" }] }] });
    expect(html(d)).toContain("<strong>");
    expect(html(d)).toContain("<em>");
  });
});

describe("renderDocument: tables and media", () => {
  it("renders accessible table headers inside a scroll container", () => {
    const d = doc({ type: "table", content: [{ type: "tableRow", content: [{ type: "tableHeader", content: [p("H")] }] }, { type: "tableRow", content: [{ type: "tableCell", content: [p("C")] }] }] });
    const out = html(d);
    expect(out).toContain('scope="col"');
    expect(out).toContain("overflow-x-auto");
  });
  const id = "3b241101-e2bb-4255-8caf-4136c566a962";
  const ref = doc({ type: "mediaRef", attrs: { mediaId: id } });
  const img: PublicMedia = { id, kind: "image", url: "https://x.supabase.co/storage/v1/object/public/media-public/a.png", embedUrl: null, mime_type: "image/png", width: 800, height: 600, duration_seconds: null, title: null, alt_text: "Alt text", caption: "Caption" };
  it("renders nothing for an unresolved/private media reference", () => {
    expect(html(ref)).toBe("");
    expect(html(ref, { media: {} })).toBe("");
  });
  it("renders a resolved image with alt text, size and lazy loading", () => {
    const out = html(ref, { media: { [id]: img } });
    expect(out).toContain('alt="Alt text"');
    expect(out).toContain('loading="lazy"');
    expect(out).toContain("<figcaption");
  });
  it("audio never preloads", () => {
    const out = html(ref, { media: { [id]: { ...img, kind: "audio", mime_type: "audio/mpeg" } } });
    expect(out).toContain('preload="none"');
  });
  it("collects media ids from nested content, ignoring invalid documents", () => {
    expect(collectMediaIds(doc({ type: "blockquote", content: [ref.content[0] as object] }))).toEqual([id]);
    expect(collectMediaIds({ nonsense: true })).toEqual([]);
  });
});

describe("Citations", () => {
  const base: Citation = {
    id: "1", title: "Source", author_or_compiler: null, edition: null, publisher: null, publication_year: null, source_url: null, volume: null, page: "12",
    chapter: null, hadith_number: null, edition_locator: null, quotation: null, authenticity_grade: "unverified", graded_by: null, reference_verified: false, editorial_notes: null,
  };
  const out = (c: Partial<Citation>) => renderToStaticMarkup(<Citations citations={[{ ...base, ...c }]} dict={getDictionary("en")} />);
  it("labels an unverified reference as unverified and shows no grade", () => {
    const o = out({});
    expect(o).toContain("has not been verified yet");
    expect(o).not.toContain("Hadith grading");
  });
  it("shows a grade only together with its authority, plus the verified marker", () => {
    const o = out({ authenticity_grade: "sahih", graded_by: "Named Authority", reference_verified: true });
    expect(o).toContain("Hadith grading");
    expect(o).toContain("Sahih");
    expect(o).toContain("Named Authority");
    expect(o).toContain("Reference checked against the source");
  });
  it("does not show 'not applicable' as a grade", () => {
    expect(out({ authenticity_grade: "not_applicable" })).not.toContain("Hadith grading");
  });
  it("renders locators and escapes hostile text", () => {
    const o = out({ title: "<b>x</b>", page: "12", hadith_number: "7" });
    expect(o).toContain("Page: 12");
    expect(o).toContain("Hadith number: 7");
    expect(o).not.toContain("<b>x</b>");
  });
  it("renders nothing when there are no citations", () => {
    expect(renderToStaticMarkup(<Citations citations={[]} dict={getDictionary("en")} />)).toBe("");
  });
});
