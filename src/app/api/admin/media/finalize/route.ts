import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaff } from "@/lib/auth/session";

const schema = z.object({
  kind: z.enum(["audio", "video"]),
  provider: z.enum(["cloudflare_r2", "cloudflare_stream"]),
  key: z.string().min(1).max(500).optional(),
  uid: z.string().min(1).max(200).optional(),
  title: z.string().trim().max(300).optional(),
  locale: z.enum(["ha", "ar", "en"]),
  mimeType: z.string().max(120).optional(),
  size: z.number().int().nonnegative().optional(),
  isPublic: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (staff.profile.role !== "admin") return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
    const { supabase } = staff;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid media metadata" }, { status: 400 });
    const input = parsed.data;
    if (input.provider === "cloudflare_r2" && (!input.key || input.kind !== "audio")) return NextResponse.json({ error: "R2 media requires an audio object key" }, { status: 400 });
    if (input.provider === "cloudflare_stream" && (!input.uid || input.kind !== "video")) return NextResponse.json({ error: "Stream media requires a video UID" }, { status: 400 });

    const { data: media, error } = await supabase.from("media_assets").insert({
      kind: input.kind,
      storage_provider: input.provider === "cloudflare_r2" ? "cloudflare_r2" : "supabase",
      storage_path: input.provider === "cloudflare_r2" ? input.key : null,
      public_path: input.provider === "cloudflare_r2" ? input.key : null,
      external_provider: input.provider === "cloudflare_stream" ? "cloudflare_stream" : null,
      external_id: input.provider === "cloudflare_stream" ? input.uid : null,
      is_public: input.isPublic,
      mime_type: input.mimeType ?? null,
      size_bytes: input.size ?? null,
      processing_status: input.provider === "cloudflare_stream" ? "pending" : "ready",
    }).select("id").single();
    if (error || !media) return NextResponse.json({ error: error?.message ?? "Unable to save media record" }, { status: 400 });

    if (input.title) {
      const { error: translationError } = await supabase.from("media_asset_translations").insert({ media_id: media.id, locale: input.locale, title: input.title });
      if (translationError) return NextResponse.json({ error: translationError.message }, { status: 400 });
    }
    return NextResponse.json({ id: media.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save media" }, { status: 500 });
  }
}
