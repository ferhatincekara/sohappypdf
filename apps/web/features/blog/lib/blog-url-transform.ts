import { defaultUrlTransform } from "react-markdown";

export function isInternalMarkdownHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

export function blogUrlTransform(url: string): string {
  const trimmed = url.trim();

  if (isInternalMarkdownHref(trimmed)) {
    return trimmed;
  }

  return defaultUrlTransform(trimmed);
}
