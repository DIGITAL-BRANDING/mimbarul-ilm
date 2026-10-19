import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;
const mediaCdnHost = process.env.NEXT_PUBLIC_MEDIA_CDN_URL
  ? new URL(process.env.NEXT_PUBLIC_MEDIA_CDN_URL).hostname
  : undefined;

/**
 * Security headers. CSP is intentionally conservative; video embeds are
 * limited to the provider allowlist in src/lib/security/embed.ts.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https://i.ytimg.com" + (supabaseHost ? ` https://${supabaseHost}` : "") + (mediaCdnHost ? ` https://${mediaCdnHost}` : ""),
  "media-src 'self' blob:" + (supabaseHost ? ` https://${supabaseHost}` : "") + (mediaCdnHost ? ` https://${mediaCdnHost}` : ""),
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://customer-*.cloudflarestream.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  // Next.js requires inline bootstrap scripts; replace with nonces before launch (see docs/PROGRESS.md).
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "connect-src 'self'" +
    (supabaseHost ? ` https://${supabaseHost} wss://${supabaseHost}` : "") +
    (process.env.NODE_ENV === "development" ? " ws:" : ""),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Lets us render a localized 404 even though the app has several root layouts (site vs admin).
  experimental: { globalNotFound: true },
  reactStrictMode: true,
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
