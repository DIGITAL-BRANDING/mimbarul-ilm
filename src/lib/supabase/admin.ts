import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv, getServerEnv } from "@/lib/env";

/**
 * Service-role client: BYPASSES RLS. Use only in trusted server code for
 * operations that cannot be expressed as RLS (e.g. rate-limit counters, audit writes
 * on behalf of anonymous actors). Never import from a Client Component.
 */
export function createServiceClient() {
  return createClient(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, getServerEnv().SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
