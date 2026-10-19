"use client";

import { useState } from "react";
import * as tus from "tus-js-client";

type Kind = "audio" | "video";

export function MediaUploadForm() {
  const [kind, setKind] = useState<Kind>("audio");
  const [locale, setLocale] = useState("ha");
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = event.currentTarget.elements.namedItem("file") as HTMLInputElement | null;
    const selected = file?.files?.[0];
    if (!selected) return setError("Choose an audio or video file first.");
    if (kind === "audio" && !selected.type.startsWith("audio/")) return setError("Choose a supported audio file.");
    if (kind === "video" && !selected.type.startsWith("video/")) return setError("Choose a supported video file.");
    setBusy(true); setProgress(0); setError(null); setMessage(null);
    try {
      const prepare = await fetch(`/api/admin/media/${kind}/upload-url`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: selected.name, contentType: selected.type || `${kind}/octet-stream`, size: selected.size }) });
      const prepared = await prepare.json() as { error?: string; uploadUrl?: string; key?: string; uid?: string; provider?: string };
      if (!prepare.ok || !prepared.uploadUrl) throw new Error(prepared.error ?? "Unable to prepare the upload");
      if (kind === "audio") {
        const uploaded = await fetch(prepared.uploadUrl, { method: "PUT", headers: { "Content-Type": selected.type || "application/octet-stream" }, body: selected });
        if (!uploaded.ok) throw new Error("Audio upload failed");
        setProgress(100);
      } else {
        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(selected, { uploadUrl: prepared.uploadUrl, uploadSize: selected.size, metadata: { filename: selected.name, filetype: selected.type || "video/mp4" }, onError: reject, onProgress: (sent, total) => setProgress(Math.round((sent / total) * 100)), onSuccess: () => resolve() });
          upload.start();
        });
      }
      const finalized = await fetch("/api/admin/media/finalize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, provider: prepared.provider, key: prepared.key, uid: prepared.uid, title: title.trim() || undefined, locale, mimeType: selected.type || null, size: selected.size, isPublic }) });
      const result = await finalized.json() as { error?: string };
      if (!finalized.ok) throw new Error(result.error ?? "Unable to save media metadata");
      setMessage("Upload complete. The media record is now in the library.");
      setTitle(""); setProgress(100);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed");
    } finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="mt-6 grid gap-5 rounded border border-rule bg-ivory p-5 shadow-sm">
    {error && <p role="alert" className="rounded border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>}
    {message && <p role="status" className="rounded border border-moss/30 bg-moss/5 px-3 py-2 text-sm text-moss">{message}</p>}
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm text-mute">Media type<select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className="rounded border border-rule bg-white px-3 py-2 text-ink"><option value="audio">Audio (Cloudflare R2)</option><option value="video">Video (Cloudflare Stream)</option></select></label>
      <label className="grid gap-1 text-sm text-mute">Locale<select value={locale} onChange={(e) => setLocale(e.target.value)} className="rounded border border-rule bg-white px-3 py-2 text-ink"><option value="ha">Hausa</option><option value="ar">Arabic</option><option value="en">English</option></select></label>
      <label className="grid gap-1 text-sm text-mute sm:col-span-2">Title<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} className="rounded border border-rule bg-white px-3 py-2 text-ink" /></label>
      <label className="grid gap-1 text-sm text-mute sm:col-span-2">File<input name="file" type="file" required accept={kind === "audio" ? "audio/*" : "video/*"} className="rounded border border-rule bg-white px-3 py-2 text-ink" /></label>
      <label className="flex items-center gap-2 text-sm text-mute sm:col-span-2"><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Make deliverable to public pages after upload</label>
    </div>
    {busy && <div className="grid gap-1 text-xs text-mute"><div className="h-2 overflow-hidden rounded bg-parchment"><div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div><span>{progress}% uploaded</span></div>}
    <button type="submit" disabled={busy} className="w-fit rounded bg-deep px-5 py-2 text-sm text-ivory hover:bg-moss disabled:cursor-wait disabled:opacity-60">{busy ? "Uploading…" : "Upload media"}</button>
  </form>;
}
