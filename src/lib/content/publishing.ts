export const PUBLISH_STATUSES = ["draft", "in_review", "published", "archived"] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

/** Allowed status transitions. Enforced in server code AND mirrored by a DB trigger. */
const TRANSITIONS: Record<PublishStatus, readonly PublishStatus[]> = {
  draft: ["in_review", "published", "archived"],
  in_review: ["draft", "published", "archived"],
  published: ["draft", "archived"], // "draft" == unpublish
  archived: ["draft"],
};

export function canTransition(from: PublishStatus, to: PublishStatus): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}

/** A translation is publicly visible only when published AND its date has arrived. */
export function isPubliclyVisible(
  input: { status: PublishStatus; publishedAt: Date | string | null },
  now: Date = new Date(),
): boolean {
  if (input.status !== "published" || !input.publishedAt) return false;
  return new Date(input.publishedAt).getTime() <= now.getTime();
}

export type PublishBlocker = "missing_title" | "missing_slug" | "empty_body" | "missing_excerpt";

/** Pre-publish validation: returns reasons publishing must be refused. */
export function getPublishBlockers(t: { title: string; slug: string; excerpt: string | null; bodyText: string }): PublishBlocker[] {
  const out: PublishBlocker[] = [];
  if (!t.title.trim()) out.push("missing_title");
  if (!t.slug.trim()) out.push("missing_slug");
  if (!t.bodyText.trim()) out.push("empty_body");
  if (!t.excerpt?.trim()) out.push("missing_excerpt");
  return out;
}
