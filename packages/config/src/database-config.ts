import { type EnvSource, getRequiredEnv } from "./env.js";

export type DatabaseConfig = {
  url: string;
};

export function loadDatabaseConfig(
  source: EnvSource = process.env,
): DatabaseConfig {
  return {
    url: getRequiredEnv("DATABASE_URL", source),
  };
}
