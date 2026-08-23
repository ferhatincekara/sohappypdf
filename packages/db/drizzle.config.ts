import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDatabaseConfig, loadEnvFile } from "@repo/config";
import { defineConfig } from "drizzle-kit";

const packageDir = dirname(fileURLToPath(import.meta.url));

loadEnvFile(resolve(packageDir, "../../.env"));

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: {
    url: loadDatabaseConfig().url,
  },
});
