import { requireStaff } from "@/lib/auth/session";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

type Counts = Record<"draft" | "in_review" | "published" | "archived", number>;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { supabase } = await requireStaff();
  const { error } = await searchParams;

  const statuses = ["draft", "in_review", "published", "archived"] as const;
  const [counts, media, recent] = await Promise.all([
    Promise.all(statuses.map((s) => supabase.from("lesson_translations").select("id", { count: "exact", head: true }).eq("status", s))),
    supabase.from("media_assets").select("id", { count: "exact", head: true }),
    supabase.from("lesson_translations").select("id, title, locale, status, updated_at").order("updated_at", { ascending: false }).limit(8),
  ]);
  const byStatus = Object.fromEntries(statuses.map((s, i) => [s, counts[i]?.count ?? 0])) as Counts;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-deep">Overview</h1>
      {error === "forbidden" && (
        <p role="alert" className="mt-4 rounded border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
          That area is limited to administrators.
        </p>
      )}
      <dl className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          ["Published", byStatus.published],
          ["Drafts", byStatus.draft],
          ["Awaiting review", byStatus.in_review],
          ["Archived", byStatus.archived],
          ["Media files", media.count ?? 0],
        ].map(([label, n]) => (
          <div key={label as string} className="rounded border border-rule bg-ivory p-4">
            <dt className="text-xs text-mute">{label}</dt>
            <dd className="mt-1 text-3xl font-semibold text-deep">{n}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-10 text-lg font-semibold text-deep">Recent updates</h2>
      {recent.data && recent.data.length > 0 ? (
        <ul className="mt-3 divide-y divide-rule rounded border border-rule bg-ivory">
          {recent.data.map((r) => (
            <li key={r.id as string} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span className="min-w-0 truncate">
                {r.title as string} <span className="text-mute">({r.locale as string})</span>
              </span>
              <span className="shrink-0 text-xs text-mute">{r.status as string}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-mute">No lessons yet. The lesson editor is the next milestone.</p>
      )}
    </div>
  );
}
