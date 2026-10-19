"use server";

import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import type { Locale } from "@/lib/i18n/config";

export type ContactState = { ok?: boolean; error?: string };

const contactSchema = z.object({
  name: z.string().trim().min(1).max(150),
  email: z.email().max(254),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(5).max(5000),
  locale: z.enum(["ha", "ar", "en"]),
  website: z.string().max(0).optional(),
});

export async function submitContact(_previous: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    subject: String(formData.get("subject") ?? "").trim() || undefined,
    message: String(formData.get("message") ?? ""),
    locale: String(formData.get("locale") ?? "ha"),
    website: String(formData.get("website") ?? ""),
  });
  if (!parsed.success) return { error: "Please complete the form correctly." };
  if (parsed.data.website) return { ok: true };
  const supabase = createServiceClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject ?? null,
    message: parsed.data.message,
    locale: parsed.data.locale as Locale,
  });
  return error ? { error: "Unable to send the message right now." } : { ok: true };
}
