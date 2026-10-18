"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/security/redirect";

const schema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
  next: z.string().max(500).optional(),
});

export interface LoginState {
  error?: string;
}

// One generic message for every failure: never reveal whether an email exists or is staff.
const GENERIC = "Email or password is incorrect.";

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    next: formData.get("next") ? String(formData.get("next")) : undefined,
  });
  if (!parsed.success) return { error: GENERIC };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error || !data.user) return { error: GENERIC };

  // Authenticated is not the same as authorised: the account must be provisioned as staff.
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
  if (!profile) {
    await supabase.auth.signOut();
    return { error: GENERIC };
  }
  redirect(safeInternalPath(parsed.data.next));
}
