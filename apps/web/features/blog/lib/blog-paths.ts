import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";

export function blogPostPath(slug: string): `/blog/${string}` {
  return `${MARKETING_PATHS.blog}/${slug}`;
}
