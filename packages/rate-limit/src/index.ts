import { assertServerOnly } from "@sohappypdf/core";

assertServerOnly("@sohappypdf/rate-limit");

export { combineAnonymousRateLimitDecisions } from "./anonymous-rate-limit.js";
export type { RateLimitService } from "./create-rate-limit-service.js";
export { createRateLimitService } from "./create-rate-limit-service.js";
export type {
  AnonymousRateLimitSubject,
  ApiClientRateLimitSubject,
  RateLimitKind,
  RateLimitSubject,
  UserRateLimitSubject,
} from "./rate-limit-identity.js";
export {
  RATE_LIMIT_KINDS,
  selectRateLimitKind,
} from "./rate-limit-identity.js";
export type { AnonymousRateLimitKeys } from "./rate-limit-key.js";
export {
  createAnonymousRateLimitKeys,
  createRateLimitKey,
} from "./rate-limit-key.js";
export type {
  RateLimitPolicies,
  RateLimitPolicy,
} from "./rate-limit-policy.js";
export {
  createRateLimitPolicies,
  RATE_LIMIT_WINDOW,
} from "./rate-limit-policy.js";
export type { RateLimitDecision } from "./rate-limit-result.js";
export { getRetryAfterSeconds } from "./rate-limit-result.js";
