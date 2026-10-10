import type { MetadataRoute } from "next";
import { postDate } from "@/lib/blog";
import { listPosts } from "@/lib/blog-store";
import { allSlugs } from "@/lib/lexicon-store";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [base, posts, terms] = await Promise.all([siteUrl(), listPosts(), allSlugs()]);
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/projects`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8, lastModified: posts[0] ? postDate(posts[0]) : undefined },
    { url: `${base}/book`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/lexicon`, changeFrequency: "monthly", priority: 0.7 },
    ...terms.map((slug) => ({ url: `${base}/lexicon/${slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
  return [...pages, ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 }))];
}
