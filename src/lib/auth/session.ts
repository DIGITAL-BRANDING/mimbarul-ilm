import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StaffProfile } from "@/types/db";

/**
 * Server-side authorization. The proxy only does a coarse redirect; THIS is the real gate and
 * is called by every admin layout/page and every admin Server Action.
 * getUser() re-validates the JWT with Supabase Auth (getSession() would trust the cookie).
 */
export async function getStaff() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("id, role, display_name").eq("id", data.user.id).maybeSingle();
  if (!profile) return null; // authenticated but not provisioned as staff => no access
  return { supabase, user: data.user, profile: profile as StaffProfile };
}

export async function requireStaff() {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}

export async function requireAdmin() {
  const staff = await requireStaff();
  if (staff.profile.role !== "admin") redirect("/admin?error=forbidden");
  return staff;
}
