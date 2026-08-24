export const APP_PATHS = {
  overview: "/account",
  usage: "/account/usage",
  activity: "/account/activity",
  billing: "/account/billing",
  apiKeys: "/account/api",
  settings: "/account/settings",
} as const;

export type AppPath = (typeof APP_PATHS)[keyof typeof APP_PATHS];

/** @deprecated Use APP_PATHS.activity — kept for redirect mapping clarity */
export const LEGACY_APP_PATHS = {
  overview: "/app",
  files: "/app/files",
  conversions: "/app/conversions",
  apiKeys: "/app/api-keys",
  settings: "/app/settings",
  billing: "/app/settings/billing",
} as const;
