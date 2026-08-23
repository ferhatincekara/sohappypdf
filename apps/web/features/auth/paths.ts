export const AUTH_PATHS = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  app: "/app",
  home: "/",
} as const;

export function loginPath(next?: string | null): string {
  const destination = next ?? AUTH_PATHS.app;

  return `${AUTH_PATHS.login}?next=${encodeURIComponent(destination)}`;
}
