import { describe, expect, it } from "vitest";
import { getCategoryOptions, getCitations, getLessonDetail, getLessonList, getLessonMedia, getLessonTaxonomy, getRedirectTarget, getRelatedLessons } from "@/lib/data/lessons";
import { getLessonTranslations } from "@/lib/data/public";
import { parseListParams } from "@/lib/content/list-params";
import { createPublicClient } from "@/lib/supabase/public";

const L1 = "10000000-0000-0000-0000-000000000001";
const L3 = "10000000-0000-0000-0000-000000000003";
const params = (o: Record<string, string> = {}) => parseListParams(o);

describe("lesson detail: originals, translations and visibility", () => {
  it("returns original vs translation metadata", async () => {
    const ha = await getLessonDetail("ha", "gwajin-ilimi");
    expect(ha).toMatchObject({ kind: "original", original_locale: "ha", content_type: "article", author_name: "Marubuci na gwaji" });
    const en = await getLessonDetail("en", "knowledge-test");
    expect(en).toMatchObject({ kind: "translation", translator_name: "Fixture Translator", review_status: "reviewed" });
  });
  it("hides a DRAFT translation of a published lesson, and its alternate link", async () => {
    expect(await getLessonDetail("en", "intentions-draft")).toBeNull();
    expect((await getLessonTranslations(L3)).map((t) => t.locale)).toEqual(["ha"]);
    expect((await getLessonTranslations(L1)).map((t) => t.locale).sort()).toEqual(["en", "ha"]);
  });
  it("hides a SCHEDULED (future) lesson", async () => {
    expect(await getLessonDetail("ha", "nan-gaba")).toBeNull();
  });
  it("never returns the same slug under another locale", async () => {
    expect(await getLessonDetail("ar", "gwajin-ilimi")).toBeNull();
  });
});

describe("redirects", () => {
  it("resolves a recorded old path", async () => {
    expect(await getRedirectTarget("/ha/lessons/tsohon-suna")).toBe("/ha/lessons/gwajin-ilimi");
  });
  it("returns null for unknown paths", async () => {
    expect(await getRedirectTarget("/ha/lessons/babu")).toBeNull();
  });
});

describe("taxonomy, citations, related", () => {
  it("localizes categories and tags, and omits missing translations", async () => {
    expect(await getLessonTaxonomy(L1, "ha")).toEqual({ categories: [{ name: "Fanni na gwaji", slug: "fanni-na-gwaji" }], tags: [{ name: "Imani" }] });
    expect(await getLessonTaxonomy(L1, "en")).toEqual({ categories: [{ name: "Test subject", slug: "test-subject" }], tags: [] });
  });
  it("returns grading with its authority and verification state exactly as stored", async () => {
    const [c] = await getCitations(L3);
    expect(c).toMatchObject({ title: "Fixture Hadith Collection", authenticity_grade: "sahih", graded_by: "Fixture authority", reference_verified: true, quotation: "Fixture quotation", hadith_number: "1" });
    const [u] = await getCitations(L1);
    expect(u).toMatchObject({ authenticity_grade: "unverified", reference_verified: false });
  });
  it("lists curated related lessons in the same locale only", async () => {
    expect((await getRelatedLessons(L1, "ha")).map((l) => l.slug)).toEqual(["niyya-a-ayyuka"]);
    expect(await getRelatedLessons(L1, "en")).toEqual([]);
  });
});

describe("media", () => {
  it("exposes only public media and builds a safe storage URL", async () => {
    const media = await getLessonMedia(L1, "ha");
    expect(media).toHaveLength(1); // the private file is invisible to the anonymous role
    expect(media[0]?.url).toMatch(/\/storage\/v1\/object\/public\/media-public\/lessons\/pub%20file\.mp3$/);
    expect(JSON.stringify(media)).not.toContain("secret");
    expect(JSON.stringify(media)).not.toContain("private/");
  });
  it("builds a validated nocookie embed URL for video", async () => {
    const [v] = await getLessonMedia(L3, "ha");
    expect(v).toMatchObject({ kind: "video", embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", title: "Bidiyon gwaji" });
  });
});

describe("listing and search", () => {
  it("lists newest first, supports oldest first, and counts", async () => {
    const newest = await getLessonList("ha", params(), null);
    expect(newest.items.map((i) => i.slug)).toEqual(["gwajin-ilimi", "niyya-a-ayyuka"]);
    expect(newest.total).toBe(2);
    expect((await getLessonList("ha", params({ sort: "old" }), null)).items.map((i) => i.slug)).toEqual(["niyya-a-ayyuka", "gwajin-ilimi"]);
  });
  it("filters by category and content type", async () => {
    const cat = (await getCategoryOptions("ha")).find((c) => c.slug === "fanni-na-gwaji");
    expect(cat).toBeTruthy();
    expect((await getLessonList("ha", params({ category: "fanni-na-gwaji" }), cat!.id)).total).toBe(2);
    expect((await getLessonList("ha", params({ type: "audio" }), null)).total).toBe(0);
  });
  it("a page past the end is not an error and still reports the real total (so the page can clamp)", async () => {
    const r = await getLessonList("ha", params({ page: "500" }), null);
    expect(r.items).toEqual([]);
    expect(r.total).toBe(2);
  });
  it("finds Arabic text with or without diacritics", async () => {
    expect((await getLessonList("ha", params({ q: "الاعمال بالنيات" }), null)).items.map((i) => i.slug)).toEqual(["niyya-a-ayyuka"]);
    expect((await getLessonList("ha", params({ q: "إِنَّمَا الْأَعْمَالُ" }), null)).items.map((i) => i.slug)).toEqual(["niyya-a-ayyuka"]);
  });
  it("keeps drafts, scheduled items and private text out of results", async () => {
    for (const q of ["unfinished", "Intentions", "nan gaba", "Rubutu na nan gaba", "private message", "secret"]) {
      expect((await getLessonList("ha", params({ q, all: "1" }), null)).items, q).toEqual([]);
    }
  });
  it("scopes to the locale unless all languages is requested", async () => {
    expect((await getLessonList("ha", params({ q: "knowledge" }), null)).items).toEqual([]);
    const all = await getLessonList("ha", params({ q: "knowledge", all: "1" }), null);
    expect(all.items.map((i) => `${i.locale}/${i.slug}`)).toEqual(["en/knowledge-test"]);
  });
  it("treats SQL/LIKE metacharacters as plain text", async () => {
    for (const q of ["100%", "_", "'; drop table lessons; --", "a\\b"]) expect((await getLessonList("ha", params({ q }), null)).items, q).toEqual([]);
  });
});

describe("row level security through the public key", () => {
  it("denies private tables to the anonymous role", async () => {
    const db = createPublicClient();
    for (const table of ["contact_messages", "audit_logs", "lesson_revisions", "profiles", "rate_limits"]) {
      const { data, error } = await db.from(table).select("*").limit(1);
      expect(error, table).toBeTruthy();
      expect(data, table).toBeNull();
    }
  });
  it("cannot write anything", async () => {
    const db = createPublicClient();
    expect((await db.from("lessons").insert({ content_type: "article" })).error).toBeTruthy();
    expect((await db.from("contact_messages").insert({ name: "x", email: "x@y.co", message: "hello there" })).error).toBeTruthy();
    const upd = await db.from("lesson_translations").update({ title: "hacked" }).eq("slug", "gwajin-ilimi").select();
    expect(upd.data ?? []).toEqual([]);
  });
});
