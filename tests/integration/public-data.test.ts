import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getLessonBySlug, getLessonSources, getLessons, getPublicLessonUrls, searchLessons } from "@/lib/data/public";

describe("public data through PostgREST and PostgreSQL RLS", () => {
  beforeAll(() => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeTruthy();
    expect(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBeTruthy();
  });
  afterAll(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it("lists only published translations visible to the anonymous role", async () => {
    const rows = await getLessons("ha");
    expect(rows.map((row) => row.slug)).toEqual(["gwajin-ilimi"]);
  });

  it("loads the public lesson body and denies the draft slug", async () => {
    const page = await getLessonBySlug("ha", "gwajin-ilimi");
    expect(page?.title).toBe("Gwajin ilimi");
    expect(page?.body).toMatchObject({ type: "doc" });
    expect(await getLessonBySlug("ha", "sirrin-daftari")).toBeNull();
  });

  it("searches actual indexed data and keeps drafts out of RPC results", async () => {
    expect((await searchLessons("ha", "jama")).map((row) => row.slug)).toContain("gwajin-ilimi");
    expect((await searchLessons("ha", "sirrin-daftari")).map((row) => row.slug)).not.toContain("sirrin-daftari");
  });

  it("returns cited sources, while sitemap URLs contain no drafts", async () => {
    expect(await getLessonSources("10000000-0000-0000-0000-000000000001")).toMatchObject([{ title: "Littafin gwaji", page: "12" }]);
    expect(await getPublicLessonUrls()).toEqual([expect.objectContaining({ locale: "ha", slug: "gwajin-ilimi" })]);
  });
});
