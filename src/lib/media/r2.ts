import "server-only";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerEnv } from "@/lib/env";

function config() {
  const env = getServerEnv();
  if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
    throw new Error("Cloudflare R2 media storage is not configured");
  }
  return env;
}

export async function createR2AudioUpload(filename: string, contentType: string) {
  const env = config();
  const client = new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! },
  });
  const safeName = filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "audio";
  const key = `audio/${crypto.randomUUID()}-${safeName}`;
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" }),
    { expiresIn: 600 },
  );
  return { uploadUrl, key };
}
