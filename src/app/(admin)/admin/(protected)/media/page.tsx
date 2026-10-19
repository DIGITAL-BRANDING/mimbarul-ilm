import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const { supabase, profile } = await requireStaff();
  const { data, error } = await supabase
    .from("media_assets")
    .select("id, kind, storage_provider, external_provider, mime_type, size_bytes, duration_seconds, is_public, processing_status, created_at, media_asset_translations(locale, title)")
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as unknown as Array<{
    id: string;
    kind: string;
    storage_provider: string | null;
    external_provider: string | null;
    mime_type: string | null;
    size_bytes: number | null;
    duration_seconds: number | null;
    is_public: boolean;
    processing_status: string;
    created_at: string;
    media_asset_translations: Array<{ locale: string; title: string | null }>;
  }>;
  const formatSize = (bytes: number | null) => bytes == null ? "—" : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  const formatDuration = (seconds: number | null) => seconds == null ? "—" : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-mute">Media library</p>
          <h1 className="mt-2 text-2xl font-semibold text-deep">Audio and video</h1>
          <p className="mt-1 text-sm text-mute">Files are delivered from Cloudflare; Supabase stores the catalogue and access rules.</p>
        </div>
        {profile.role === "admin" && <Link href="/admin/media/new" className="rounded bg-deep px-4 py-2 text-sm text-ivory hover:bg-moss">Upload media</Link>}
      </div>
      {error ? (
        <p role="alert" className="mt-6 rounded border border-danger/40 bg-danger/5 p-4 text-sm text-danger">Unable to load media: {error.message}</p>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded border border-dashed border-rule bg-ivory p-8 text-center text-sm text-mute">No media has been uploaded yet.</div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded border border-rule bg-ivory">
          <table className="w-full min-w-[58rem] border-collapse text-left text-sm">
            <thead className="border-b border-rule bg-parchment text-xs uppercase tracking-wide text-mute"><tr>
              <th className="px-4 py-3">Title</th><th className="px-4 py-3">Kind</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Size / length</th><th className="px-4 py-3">State</th><th className="px-4 py-3">Created</th>
            </tr></thead>
            <tbody className="divide-y divide-rule">
              {rows.map((row) => <tr key={row.id} className="hover:bg-parchment/40">
                <td className="px-4 py-3 font-medium text-deep">{row.media_asset_translations[0]?.title ?? "Untitled media"}<div className="text-xs text-mute">{row.mime_type ?? "—"}</div></td>
                <td className="px-4 py-3 capitalize text-mute">{row.kind}</td>
                <td className="px-4 py-3 text-mute">{row.external_provider ?? row.storage_provider ?? "—"}</td>
                <td className="px-4 py-3 text-mute">{formatSize(row.size_bytes)} · {formatDuration(row.duration_seconds)}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-parchment px-2 py-1 text-xs capitalize">{row.is_public ? "public" : "private"} · {row.processing_status}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-mute">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(row.created_at))}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
