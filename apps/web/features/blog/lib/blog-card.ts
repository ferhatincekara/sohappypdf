import type { BlogPostFrontmatter } from "@/features/blog/lib/blog-frontmatter";
import { blogPostPath } from "@/features/blog/lib/blog-paths";
import { formatBlogDate } from "@/features/blog/lib/format-blog-date";

export type BlogPostCardModel = {
  href: `/blog/${string}`;
  title: string;
  description: string;
  displayDate: string;
  author: string;
  role: string;
  cover: string;
  coverAlt: string;
};

export function toBlogPostCard(
  post: BlogPostFrontmatter,
  locale: string,
): BlogPostCardModel {
  return {
    href: blogPostPath(post.slug),
    title: post.title,
    description: post.description,
    displayDate: formatBlogDate(post.date, locale),
    author: post.author,
    role: post.role,
    cover: post.cover,
    coverAlt: post.coverAlt,
  };
}
