import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

/**
 * Cookie-less anonymous client for PUBLIC pages. Because it never touches cookies, pages that use it can be
 * statically rendered / ISR-cached. It can only ever see what RLS exposes to the `anon` role: published content.
 */
export function createPublicClient() {
  const env = getPublicEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
