import { type EnvSource, getRequiredEnv } from "./env.js";

export type QueueConfig = {
  restUrl: string;
  restToken: string;
};

export function loadQueueConfig(source: EnvSource = process.env): QueueConfig {
  return {
    restUrl: getRequiredEnv("UPSTASH_REDIS_REST_URL", source),
    restToken: getRequiredEnv("UPSTASH_REDIS_REST_TOKEN", source),
  };
}
