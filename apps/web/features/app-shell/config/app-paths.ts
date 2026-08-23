export const APP_PATHS = {
  overview: "/app",
  files: "/app/files",
  conversions: "/app/conversions",
  apiKeys: "/app/api-keys",
  settings: "/app/settings",
} as const;

export type AppPath = (typeof APP_PATHS)[keyof typeof APP_PATHS];
