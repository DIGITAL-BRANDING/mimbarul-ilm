import { describe, expect, it } from "vitest";
import { parseVideoUrl } from "@/lib/security/embed";
import { safeInternalPath } from "@/lib/security/redirect";

describe("parseVideoUrl", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=10", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("accepts %s", (url, id) => {
    const r = parseVideoUrl(url);
    expect(r?.id).toBe(id);
    expect(r?.embedUrl).toBe(`https://www.youtube-nocookie.com/embed/${id}`);
  });
  it("accepts Vimeo", () => expect(parseVideoUrl("https://vimeo.com/123456789")?.embedUrl).toBe("https://player.vimeo.com/video/123456789?dnt=1"));
  it.each([
    "http://www.youtube.com/watch?v=dQw4w9WgXcQ", // not https
    "https://evil.example/watch?v=dQw4w9WgXcQ",
    "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/watch?v=\"><script>alert(1)</script>",
    "javascript:alert(1)",
    "not a url",
    "",
  ])("rejects %j", (url) => expect(parseVideoUrl(url)).toBeNull());
});

describe("safeInternalPath", () => {
  it("allows internal paths", () => expect(safeInternalPath("/admin/lessons?x=1")).toBe("/admin/lessons?x=1"));
  it.each(["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "", null, undefined, "/a\nb"])("falls back for %j", (v) => expect(safeInternalPath(v)).toBe("/admin"));
});
