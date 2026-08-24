import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const DOCS_DIR = join(import.meta.dir, "../../../../docs/api");

async function listDocFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listDocFiles(path)));
      continue;
    }

    files.push(path);
  }

  return files;
}

describe("developer documentation security", () => {
  test("does not embed credentials or storage internals", async () => {
    const files = await listDocFiles(DOCS_DIR);
    const contents = await Promise.all(
      files.map(async (path) => ({
        path,
        text: await readFile(path, "utf8"),
      })),
    );

    expect(files.length).toBeGreaterThan(0);
    expect(contents.some((file) => file.text.includes("YOUR_API_KEY"))).toBe(
      true,
    );

    for (const file of contents) {
      expect(file.text).not.toContain("polar_oat_");
      expect(file.text).not.toContain("AKIA");
      expect(file.text).not.toContain("AWS_SECRET_ACCESS_KEY");
      expect(file.text).not.toContain("S3_BUCKET_NAME");
    }
  });
});
