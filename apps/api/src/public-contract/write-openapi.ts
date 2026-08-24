import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createOpenApiDocument } from "./openapi.js";

const outputPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../docs/api/openapi.json",
);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify(createOpenApiDocument(), null, 2)}\n`,
);

const formatted = spawnSync("bunx", ["biome", "check", "--write", outputPath], {
  stdio: "inherit",
});

if (formatted.status !== 0) {
  throw new Error("Failed to format OpenAPI document");
}

console.log(`Wrote ${outputPath}`);
