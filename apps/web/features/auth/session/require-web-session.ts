import { AUTH_PATHS, loginPath } from "../paths";
import { getWebSession, type WebSession } from "./get-web-session";
import { redirectTo } from "./redirect-to";

export async function requireWebSession(): Promise<WebSession> {
  const session = await getWebSession();

  if (session === null) {
    redirectTo(loginPath(AUTH_PATHS.app));
  }

  return session;
}
