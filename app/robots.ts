import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/blog/new", "/blog/login", "/blog/*/edit"] },
    sitemap: `${await siteUrl()}/sitemap.xml`,
  };
}
