export const AUTH_PATHS = {
  login: "/login",
  register: "/register",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  app: "/account/settings",
  afterAuth: "/tools",
  home: "/",
} as const;

export function loginPath(next?: string | null): string {
  const destination = next ?? AUTH_PATHS.afterAuth;

  return `${AUTH_PATHS.login}?next=${encodeURIComponent(destination)}`;
}

export function signupPath(next?: string | null): string {
  if (next === undefined || next === null || next.trim() === "") {
    return AUTH_PATHS.signup;
  }

  return `${AUTH_PATHS.signup}?next=${encodeURIComponent(next)}`;
}
