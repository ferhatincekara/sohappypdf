import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const postsRoot = join(scriptDir, "../features/blog/posts");
const outputPath = join(
  scriptDir,
  "../features/blog/lib/blog-post-contents.ts",
);
const locales = ["en", "tr"] as const;

const contents: Record<(typeof locales)[number], Record<string, string>> = {
  en: {},
  tr: {},
};

for (const locale of locales) {
  const directory = join(postsRoot, locale);
  const files = readdirSync(directory)
    .filter((name) => name.endsWith(".md"))
    .sort();

  for (const name of files) {
    const slug = name.slice(0, -3);
    contents[locale][slug] = readFileSync(join(directory, name), "utf8");
  }
}

writeFileSync(
  outputPath,
  `export const BLOG_POST_CONTENTS = ${JSON.stringify(contents, null, 2)} as const;\n`,
);

console.log(`Wrote embedded blog posts to ${outputPath}`);
