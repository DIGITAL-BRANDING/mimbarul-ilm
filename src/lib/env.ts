import { z } from "zod";

/** Variables safe for the browser. Accessed via literal process.env keys so Next can inline them. */
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().transform((v) => v.replace(/\/+$/, "")),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20, "Publishable key looks too short"),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  CONTACT_NOTIFY_EMAIL: z.string().optional(),
});

export type PublicEnv = z.infer<typeof publicSchema>;

let cachedPublic: PublicEnv | undefined;

export function getPublicEnv(): PublicEnv {
  if (cachedPublic) return cachedPublic;
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      "Invalid public environment configuration:\n" +
        parsed.error.issues.map((i) => ` - ${i.path.join(".")}: ${i.message}`).join("\n") +
        "\nSee .env.example",
    );
  }
  cachedPublic = parsed.data;
  return cachedPublic;
}

/** Server-only variables. Throws if called in the browser bundle. */
export function getServerEnv() {
  if (typeof window !== "undefined") throw new Error("getServerEnv() must never run in the browser");
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      "Invalid server environment configuration:\n" +
        parsed.error.issues.map((i) => ` - ${i.path.join(".")}: ${i.message}`).join("\n"),
    );
  }
  return parsed.data;
}
