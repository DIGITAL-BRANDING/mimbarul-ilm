import { isValidSlug } from "./slug";

export const CONTENT_TYPES = ["article", "audio", "video", "book_commentary"] as const;
export type ContentTypeValue = (typeof CONTENT_TYPES)[number];
export const PAGE_SIZE = 12;
export const MAX_PAGE = 500;

export type SortOrder = "new" | "old";

export interface ListParams {
  q: string;
  category: string | null; // category slug (localized)
  type: ContentTypeValue | null;
  sort: SortOrder;
  page: number;
  all: boolean; // search across all languages
}

type Raw = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** URL query strings are untrusted: every value is clamped/validated here, never passed through raw. */
export function parseListParams(raw: Raw): ListParams {
  const q = (first(raw.q) ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
  const cat = first(raw.category) ?? "";
  const type = first(raw.type) ?? "";
  const page = Number.parseInt(first(raw.page) ?? "1", 10);
  return {
    q,
    category: isValidSlug(cat) ? cat : null,
    type: (CONTENT_TYPES as readonly string[]).includes(type) ? (type as ContentTypeValue) : null,
    sort: first(raw.sort) === "old" ? "old" : "new",
    page: Number.isFinite(page) ? Math.min(Math.max(page, 1), MAX_PAGE) : 1,
    all: first(raw.all) === "1",
  };
}

/** Builds a listing URL containing only non-default parameters. */
export function buildListHref(base: string, p: Partial<ListParams>): string {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.category) sp.set("category", p.category);
  if (p.type) sp.set("type", p.type);
  if (p.sort === "old") sp.set("sort", "old");
  if (p.all) sp.set("all", "1");
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export function hasActiveFilters(p: ListParams): boolean {
  return Boolean(p.q || p.category || p.type || p.sort === "old" || p.all);
}
