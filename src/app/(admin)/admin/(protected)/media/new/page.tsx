import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { MediaUploadForm } from "./MediaUploadForm";

export const dynamic = "force-dynamic";

export default async function NewMediaPage() {
  await requireAdmin();
  return <div className="max-w-3xl"><Link href="/admin/media" className="text-sm text-gold underline underline-offset-2">← Back to media</Link><p className="mt-4 text-sm font-medium uppercase tracking-wide text-mute">Media library</p><h1 className="mt-2 text-2xl font-semibold text-deep">Upload audio or video</h1><p className="mt-1 text-sm text-mute">The browser uploads directly to the configured provider, so Railway does not buffer the file.</p><MediaUploadForm /></div>;
}
