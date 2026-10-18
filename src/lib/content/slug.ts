/**
 * Slug generation. Slugs are ASCII-normalised so URLs stay stable and shareable.
 * Hausa hooked letters (ɓ ɗ ƙ ƴ) map to their base letters; Arabic titles
 * require an explicit, human-supplied slug (no machine transliteration - it would be unreliable).
 */
const HAUSA_MAP: Record<string, string> = { ɓ: "b", ɗ: "d", ƙ: "k", ƴ: "y", Ɓ: "b", Ɗ: "d", Ƙ: "k", Ƴ: "y" };

export function slugify(input: string): string {
  const mapped = Array.from(input.normalize("NFC")).map((c) => HAUSA_MAP[c] ?? c).join("");
  return mapped
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip Latin diacritics
    .replace(/['’`]/g, "") // drop apostrophes (ta'aziyya -> taaziyya)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)
    .replace(/-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return slug.length >= 1 && slug.length <= 96 && SLUG_PATTERN.test(slug);
}

/** Reserved path segments that must never be used as a lesson slug. */
export const RESERVED_SLUGS = new Set(["new", "edit", "admin", "api", "page", "feed"]);
