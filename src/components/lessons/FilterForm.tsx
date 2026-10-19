import Link from "next/link";
import { CONTENT_TYPES, hasActiveFilters, type ListParams } from "@/lib/content/list-params";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const field = "ui w-full rounded border border-rule bg-white px-3 py-2";

/** Plain GET form: filters live in the URL (shareable, works without JavaScript). */
export function FilterForm({
  action,
  params,
  categories,
  dict,
  showSort = true,
}: {
  action: string;
  params: ListParams;
  categories: Array<{ name: string; slug: string }>;
  dict: Dictionary;
  showSort?: boolean;
}) {
  return (
    <form action={action} method="get" role="search" aria-label={dict.lessons.filters} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
      <div>
        <label htmlFor="f-q" className="sr-only">
          {dict.searchPlaceholder}
        </label>
        <input id="f-q" name="q" type="search" maxLength={200} defaultValue={params.q} placeholder={dict.searchPlaceholder} className={field} />
      </div>
      <div>
        <label htmlFor="f-cat" className="sr-only">
          {dict.lessons.category}
        </label>
        <select id="f-cat" name="category" defaultValue={params.category ?? ""} className={field}>
          <option value="">{dict.lessons.allCategories}</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-type" className="sr-only">
          {dict.lessons.type}
        </label>
        <select id="f-type" name="type" defaultValue={params.type ?? ""} className={field}>
          <option value="">{dict.lessons.allTypes}</option>
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {dict.types[t]}
            </option>
          ))}
        </select>
      </div>
      {showSort && (
        <div>
          <label htmlFor="f-sort" className="sr-only">
            {dict.lessons.sort}
          </label>
          <select id="f-sort" name="sort" defaultValue={params.sort} className={field}>
            <option value="new">{dict.lessons.newest}</option>
            <option value="old">{dict.lessons.oldest}</option>
          </select>
        </div>
      )}
      {params.all && <input type="hidden" name="all" value="1" />}
      <div className="flex gap-2">
        <button type="submit" className="ui rounded bg-deep px-5 py-2 font-medium text-ivory hover:bg-moss">
          {dict.lessons.apply}
        </button>
        {hasActiveFilters(params) && (
          <Link href={action} className="ui rounded border border-rule px-4 py-2 text-sm leading-[1.9] hover:bg-parchment">
            {dict.lessons.clear}
          </Link>
        )}
      </div>
    </form>
  );
}
