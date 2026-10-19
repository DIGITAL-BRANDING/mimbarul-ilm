import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaff } from "@/lib/auth/session";
import { createR2AudioUpload } from "@/lib/media/r2";

const schema = z.object({ filename: z.string().min(1).max(180), contentType: z.string().regex(/^audio\//), size: z.number().int().positive().max(2_147_483_648) });

export async function POST(request: Request) {
  try {
    const staff = await getStaff();
    if (!staff) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (staff.profile.role !== "admin") return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid audio file metadata" }, { status: 400 });
    return NextResponse.json({ provider: "cloudflare_r2", ...(await createR2AudioUpload(parsed.data.filename, parsed.data.contentType)) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to prepare upload" }, { status: 500 });
  }
}
