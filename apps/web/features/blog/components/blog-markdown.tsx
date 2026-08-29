import type { Route } from "next";
import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  blogUrlTransform,
  isInternalMarkdownHref,
} from "@/features/blog/lib/blog-url-transform";
import { Link } from "@/lib/i18n/navigation";

const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="mt-10 text-2xl font-bold tracking-tight md:text-[28px]">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 text-xl font-bold tracking-tight">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mt-4 text-base leading-7 text-foreground/90">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-7">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-2 pl-5 text-base leading-7">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  a: ({ href, children }) => {
    if (href === undefined || href === "") {
      return <span>{children}</span>;
    }

    if (isInternalMarkdownHref(href)) {
      return (
        <Link
          href={href as Route}
          className="font-semibold text-foreground underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground"
        >
          {children}
        </Link>
      );
    }

    return (
      <a
        href={href}
        rel="noreferrer"
        target="_blank"
        className="font-semibold text-foreground underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground"
      >
        {children}
      </a>
    );
  },
  pre: ({ children }) => (
    <pre className="mt-5 overflow-x-auto rounded-2xl bg-muted px-4 py-3 font-mono text-xs leading-relaxed text-foreground">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    if (className !== undefined) {
      return <code className={className}>{children}</code>;
    }

    return (
      <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px]">
        {children}
      </code>
    );
  },
};

export function BlogMarkdown({ content }: { content: string }) {
  return (
    <div className="max-w-none">
      <Markdown
        remarkPlugins={[remarkGfm]}
        urlTransform={blogUrlTransform}
        components={markdownComponents}
      >
        {content}
      </Markdown>
    </div>
  );
}
