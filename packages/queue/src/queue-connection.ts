import { loadQueueConfig, type QueueConfig } from "@repo/config";
import { APP_ERROR_CODES, AppError } from "@repo/core";

const UPSTASH_REDIS_PORT = 6379;

export type QueueConnectionRole = "producer" | "worker";

export type QueueConnectionOptions = {
  host: string;
  port: number;
  username: "default";
  password: string;
  tls: Record<string, never>;
  maxRetriesPerRequest: number | null;
  enableReadyCheck: false;
};

function parseUpstashRestUrl(restUrl: string): URL {
  let parsed: URL;

  try {
    parsed = new URL(restUrl);
  } catch {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Invalid Upstash Redis REST URL",
    });
  }

  if (parsed.protocol !== "https:") {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Invalid Upstash Redis REST URL",
    });
  }

  if (parsed.hostname.length === 0 || parsed.username || parsed.password) {
    throw new AppError({
      code: APP_ERROR_CODES.CONFIGURATION_ERROR,
      message: "Invalid Upstash Redis REST URL",
    });
  }

  return parsed;
}

export function createQueueConnectionOptions(
  config: QueueConfig,
  role: QueueConnectionRole = "producer",
): QueueConnectionOptions {
  const parsed = parseUpstashRestUrl(config.restUrl);

  return {
    host: parsed.hostname,
    port: UPSTASH_REDIS_PORT,
    username: "default",
    password: config.restToken,
    tls: {},
    maxRetriesPerRequest: role === "worker" ? null : 20,
    enableReadyCheck: false,
  };
}

export function getQueueConnectionOptions(
  role: QueueConnectionRole = "producer",
): QueueConnectionOptions {
  return createQueueConnectionOptions(loadQueueConfig(), role);
}
