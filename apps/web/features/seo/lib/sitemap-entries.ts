import { listRegisteredTools } from "@sohappypdf/tools/catalog";
import type { MetadataRoute } from "next";
import { AUTH_PATHS } from "@/features/auth/paths";
import { blogPostPath } from "@/features/blog/lib/blog-paths";
import { listBlogPosts } from "@/features/blog/lib/load-blog-posts";
import { PUBLIC_MARKETING_ROUTES } from "@/features/marketing/lib/marketing-paths";
import {
  MARKETING_TOOL_CATEGORY_ORDER,
  toolCategoryPath,
} from "@/features/marketing/lib/marketing-tools";

export type PublicSitemapEntry = {
  path: string;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
  lastModified?: Date;
};

const MARKETING_SITEMAP_META: Record<
  string,
  Pick<PublicSitemapEntry, "changeFrequency" | "priority">
> = {
  "/": { changeFrequency: "weekly", priority: 1 },
  "/tools": { changeFrequency: "weekly", priority: 0.9 },
  "/pricing": { changeFrequency: "monthly", priority: 0.7 },
  "/blog": { changeFrequency: "weekly", priority: 0.6 },
  "/faq": { changeFrequency: "monthly", priority: 0.5 },
  "/about": { changeFrequency: "monthly", priority: 0.5 },
  "/contact": { changeFrequency: "monthly", priority: 0.5 },
  "/developers": { changeFrequency: "monthly", priority: 0.5 },
  "/login": { changeFrequency: "yearly", priority: 0.2 },
  "/signup": { changeFrequency: "yearly", priority: 0.2 },
  "/security": { changeFrequency: "yearly", priority: 0.3 },
  "/privacy": { changeFrequency: "yearly", priority: 0.3 },
  "/terms": { changeFrequency: "yearly", priority: 0.3 },
  "/cookies": { changeFrequency: "yearly", priority: 0.3 },
};

function marketingSitemapMeta(
  path: string,
): Pick<PublicSitemapEntry, "changeFrequency" | "priority"> {
  return (
    MARKETING_SITEMAP_META[path] ?? {
      changeFrequency: "monthly",
      priority: 0.5,
    }
  );
}

export function listPublicSitemapEntries(): PublicSitemapEntry[] {
  const marketing = PUBLIC_MARKETING_ROUTES.map((path) => ({
    path,
    ...marketingSitemapMeta(path),
  }));

  const authUtility = [
    {
      path: AUTH_PATHS.forgotPassword,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
  ];

  const categories = MARKETING_TOOL_CATEGORY_ORDER.map((category) => ({
    path: toolCategoryPath(category),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const tools = listRegisteredTools().map((tool) => ({
    path: tool.route,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const posts = listBlogPosts("en").map((post) => ({
    path: blogPostPath(post.slug),
    changeFrequency: "monthly" as const,
    priority: 0.6,
    lastModified: new Date(`${post.date}T00:00:00.000Z`),
  }));

  return [...marketing, ...authUtility, ...categories, ...tools, ...posts];
}

export function toSitemapUrl(appUrl: string, path: string): string {
  const base = appUrl.replace(/\/$/, "");

  return path === "/" ? base : `${base}${path}`;
}

export function buildSitemap(appUrl: string): MetadataRoute.Sitemap {
  return listPublicSitemapEntries().map((entry) => ({
    url: toSitemapUrl(appUrl, entry.path),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
    lastModified: entry.lastModified,
  }));
}
