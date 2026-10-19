import Link from "next/link";
import { buildListHref, PAGE_SIZE, type ListParams } from "@/lib/content/list-params";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Pagination({ base, params, total, dict }: { base: string; params: ListParams; total: number; dict: Dictionary }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  const { page } = params;
  const link = "ui rounded border border-rule px-4 py-2 text-sm hover:bg-parchment";
  return (
    <nav aria-label={dict.lessons.pagination} className="mt-8 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link rel="prev" className={link} href={buildListHref(base, { ...params, page: page - 1 })}>
          ← {dict.lessons.prev}
        </Link>
      ) : (
        <span />
      )}
      <p className="ui text-sm text-mute" aria-current="page">
        {dict.lessons.page} {page} {dict.lessons.of} {pages}
      </p>
      {page < pages ? (
        <Link rel="next" className={link} href={buildListHref(base, { ...params, page: page + 1 })}>
          {dict.lessons.next} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
