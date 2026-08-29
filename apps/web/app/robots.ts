import type { MetadataRoute } from "next";
import { getPublicWebEnv } from "@/config/public-env";
import { buildRobots } from "@/features/seo/lib/robots-policy";

export default function robots(): MetadataRoute.Robots {
  return buildRobots(getPublicWebEnv().appUrl);
}
