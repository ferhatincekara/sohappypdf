import type { MetadataRoute } from "next";

export const ROBOTS_DISALLOW = [
  "/account",
  "/account/",
  "/ui",
  "/register",
  "/reset-password",
] as const;

export function buildRobots(appUrl: string): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...ROBOTS_DISALLOW],
    },
    sitemap: `${appUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}
