import { AUTH_PATHS, loginPath } from "@/features/auth/paths";
import {
  getWebSession,
  type WebSession,
} from "@/features/auth/session/get-web-session";
import { redirectTo } from "@/features/auth/session/redirect-to";

export async function requireWebSession(): Promise<WebSession> {
  const session = await getWebSession();

  if (session === null) {
    redirectTo(loginPath(AUTH_PATHS.app));
  }

  return session;
}
