import type { BlogPostFrontmatter } from "./blog-frontmatter";
import { blogPostPath } from "./blog-paths";
import { formatBlogDate } from "./format-blog-date";

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
