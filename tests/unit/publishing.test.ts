import { describe, expect, it } from "vitest";
import { canTransition, getPublishBlockers, isPubliclyVisible } from "@/lib/content/publishing";

describe("canTransition", () => {
  it("allows draft -> published and published -> draft (unpublish)", () => {
    expect(canTransition("draft", "published")).toBe(true);
    expect(canTransition("published", "draft")).toBe(true);
  });
  it("forbids archived -> published directly", () => expect(canTransition("archived", "published")).toBe(false));
  it("forbids published -> in_review", () => expect(canTransition("published", "in_review")).toBe(false));
  it("allows no-op", () => expect(canTransition("draft", "draft")).toBe(true));
});

describe("isPubliclyVisible", () => {
  const now = new Date("2026-06-01T12:00:00Z");
  it("hides drafts even with a past date", () => expect(isPubliclyVisible({ status: "draft", publishedAt: "2026-01-01" }, now)).toBe(false));
  it("hides published items scheduled in the future", () => expect(isPubliclyVisible({ status: "published", publishedAt: "2026-07-01" }, now)).toBe(false));
  it("hides published items with no date", () => expect(isPubliclyVisible({ status: "published", publishedAt: null }, now)).toBe(false));
  it("shows published items whose date has passed", () => expect(isPubliclyVisible({ status: "published", publishedAt: "2026-05-01" }, now)).toBe(true));
  it("hides archived", () => expect(isPubliclyVisible({ status: "archived", publishedAt: "2026-01-01" }, now)).toBe(false));
});

describe("getPublishBlockers", () => {
  it("lists every missing requirement", () => {
    expect(getPublishBlockers({ title: " ", slug: "", excerpt: null, bodyText: "\n" }).sort()).toEqual(["empty_body", "missing_excerpt", "missing_slug", "missing_title"]);
  });
  it("returns nothing for a complete translation", () => {
    expect(getPublishBlockers({ title: "T", slug: "t", excerpt: "e", bodyText: "body" })).toEqual([]);
  });
});
