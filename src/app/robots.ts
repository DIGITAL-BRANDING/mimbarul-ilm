import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const site = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/*/search"] }, sitemap: `${site}/sitemap.xml`, host: site };
}
