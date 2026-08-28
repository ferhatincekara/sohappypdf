import { neonConfig, Pool } from "@neondatabase/serverless";
import { loadDatabaseConfig } from "@repo/config";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema/index.js";

neonConfig.poolQueryViaFetch = true;

export type CreateDatabaseOptions = {
  url: string;
};

export function createDatabase(options: CreateDatabaseOptions) {
  const pool = new Pool({ connectionString: options.url });
  pool.on("error", () => {
    // Neon closes idle WebSocket connections; the next query opens a new one.
  });
  return drizzle(pool, {
    schema,
    casing: "snake_case",
  });
}

export type Database = ReturnType<typeof createDatabase>;

let database: Database | undefined;

export function getDb(): Database {
  if (database === undefined) {
    database = createDatabase(loadDatabaseConfig());
  }

  return database;
}
