import { neon } from "@neondatabase/serverless";
import { loadDatabaseConfig } from "@repo/config";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/index.js";

export type CreateDatabaseOptions = {
  url: string;
};

export function createDatabase(options: CreateDatabaseOptions) {
  const client = neon(options.url);
  return drizzle({
    client,
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
