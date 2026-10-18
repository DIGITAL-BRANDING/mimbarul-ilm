import { describe, expect, it } from "vitest";
import { extractText, validateDocument } from "@/lib/content/document";

const p = (text: string, attrs?: object) => ({ type: "paragraph", ...(attrs ? { attrs } : {}), content: [{ type: "text", text }] });

describe("validateDocument", () => {
  it("accepts mixed Arabic/Hausa content with explicit direction", () => {
    const r = validateDocument({
      type: "doc",
      content: [
        p("Hadisi ya ce:"),
        { type: "blockquote", attrs: { kind: "hadith", dir: "rtl", lang: "ar" }, content: [p("إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ", { dir: "rtl", lang: "ar" })] },
      ],
    });
    expect(r.ok).toBe(true);
  });
  it("accepts safe links", () => {
    const r = validateDocument({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "https://example.com" } }] }] }] });
    expect(r.ok).toBe(true);
  });
  it.each(["javascript:alert(1)", "data:text/html,<script>1</script>", "vbscript:x"])("rejects link %s", (href) => {
    const r = validateDocument({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href } }] }] }] });
    expect(r.ok).toBe(false);
  });
  it("rejects unknown node types (raw HTML smuggling)", () => {
    expect(validateDocument({ type: "doc", content: [{ type: "html", attrs: { html: "<script>1</script>" } }] }).ok).toBe(false);
    expect(validateDocument({ type: "doc", content: [{ type: "iframe", attrs: { src: "https://evil" } }] }).ok).toBe(false);
  });
  it("rejects unexpected attributes on known nodes", () => {
    expect(validateDocument({ type: "doc", content: [{ type: "paragraph", attrs: { onclick: "x()" } }] }).ok).toBe(false);
  });
  it("rejects h1 headings (page title owns h1)", () => {
    expect(validateDocument({ type: "doc", content: [{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "x" }] }] }).ok).toBe(false);
  });
  it("rejects over-deep nesting", () => {
    let node: object = p("deep");
    for (let i = 0; i < 20; i++) node = { type: "blockquote", content: [node] };
    expect(validateDocument({ type: "doc", content: [node] }).ok).toBe(false);
  });
  it("rejects non-objects", () => {
    expect(validateDocument(null).ok).toBe(false);
    expect(validateDocument("<p>hi</p>").ok).toBe(false);
  });
  it("requires a UUID for media references", () => {
    expect(validateDocument({ type: "doc", content: [{ type: "mediaRef", attrs: { mediaId: "../../etc/passwd" } }] }).ok).toBe(false);
    expect(validateDocument({ type: "doc", content: [{ type: "mediaRef", attrs: { mediaId: "3b241101-e2bb-4255-8caf-4136c566a962" } }] }).ok).toBe(true);
  });
});

describe("extractText", () => {
  it("extracts text across blocks, preserving Arabic diacritics", () => {
    const r = validateDocument({ type: "doc", content: [p("Salam"), p("إِنَّمَا الْأَعْمَالُ")] });
    expect(r.ok && extractText(r.doc)).toBe("Salam\nإِنَّمَا الْأَعْمَالُ\n");
  });
  it("is blank for an empty document", () => {
    const r = validateDocument({ type: "doc", content: [{ type: "paragraph" }] });
    expect(r.ok && extractText(r.doc).trim()).toBe("");
  });
});
