"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { PublicCopy } from "@/lib/i18n/public-copy";
import { submitContact, type ContactState } from "./actions";

export function ContactForm({ locale, copy }: { locale: Locale; copy: PublicCopy }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, {});
  return <form action={action} className="mt-8 grid gap-5" noValidate>
    <input type="hidden" name="locale" value={locale} />
    <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
    <label className="grid gap-1"><span className="ui text-sm font-medium">{copy.name}</span><input name="name" required maxLength={150} className="rounded border border-rule bg-white px-3 py-2" /></label>
    <label className="grid gap-1"><span className="ui text-sm font-medium">{copy.email}</span><input name="email" type="email" required maxLength={254} className="rounded border border-rule bg-white px-3 py-2" /></label>
    <label className="grid gap-1"><span className="ui text-sm font-medium">{copy.subject}</span><input name="subject" maxLength={200} className="rounded border border-rule bg-white px-3 py-2" /></label>
    <label className="grid gap-1"><span className="ui text-sm font-medium">{copy.message}</span><textarea name="message" required minLength={5} maxLength={5000} rows={7} className="rounded border border-rule bg-white px-3 py-2" /></label>
    {state.ok && <p className="rounded border border-moss/40 bg-moss/5 px-4 py-3 text-moss" role="status">{copy.sent}</p>}
    {state.error && <p className="rounded border border-danger/40 bg-danger/5 px-4 py-3 text-danger" role="alert">{copy.sendError}</p>}
    <button type="submit" disabled={pending} className="ui w-fit rounded bg-deep px-5 py-3 font-medium text-ivory disabled:opacity-60">{pending ? "…" : copy.send}</button>
  </form>;
}
