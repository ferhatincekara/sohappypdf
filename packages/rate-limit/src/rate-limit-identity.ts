export const RATE_LIMIT_KINDS = ["anonymous", "authenticated", "api"] as const;

export type RateLimitKind = (typeof RATE_LIMIT_KINDS)[number];

export type AnonymousRateLimitSubject = {
  kind: "anonymous";
  ip: string;
};

export type UserRateLimitSubject = {
  kind: "user";
  userId: string;
};

export type ApiClientRateLimitSubject = {
  kind: "api-client";
  apiClientId: string;
  userId: string;
};

export type RateLimitSubject =
  | AnonymousRateLimitSubject
  | UserRateLimitSubject
  | ApiClientRateLimitSubject;

export function selectRateLimitKind(subject: RateLimitSubject): RateLimitKind {
  switch (subject.kind) {
    case "anonymous":
      return "anonymous";
    case "user":
      return "authenticated";
    case "api-client":
      return "api";
  }
}
