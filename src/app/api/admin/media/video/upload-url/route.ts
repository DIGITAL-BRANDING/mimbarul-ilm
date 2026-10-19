import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaff } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/env";

const schema = z.object({ filename: z.string().min(1).max(180), size: z.number().int().positive().max(30_000_000_000) });

export async function POST(request: Request) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (staff.profile.role !== "admin") return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid video file metadata" }, { status: 400 });
    const env = getServerEnv();
    if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) throw new Error("Cloudflare Stream is not configured");
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ maxDurationSeconds: 21600, meta: { name: parsed.data.filename } }),
      cache: "no-store",
    });
    const payload = (await response.json()) as { success?: boolean; errors?: Array<{ message?: string }>; result?: { uid?: string; uploadURL?: string } };
    if (!response.ok || !payload.success || !payload.result?.uid || !payload.result.uploadURL) {
      return NextResponse.json({ error: payload.errors?.[0]?.message ?? "Cloudflare Stream could not create an upload" }, { status: 502 });
    }
    return NextResponse.json({ provider: "cloudflare_stream", uid: payload.result.uid, uploadUrl: payload.result.uploadURL });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to prepare upload" }, { status: 500 });
  }
}
