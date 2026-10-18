import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

/** Browser client. Uses only the publishable key; every table is protected by RLS. */
export function createClient() {
  const env = getPublicEnv();
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
