import type { MetadataRoute } from "next";
import { getPublicWebEnv } from "@/config/public-env";
import { buildSitemap } from "@/features/seo/lib/sitemap-entries";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(getPublicWebEnv().appUrl);
}
