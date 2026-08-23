import { resolveGuestOnlyRedirect } from "../safe-redirect";
import { getWebSession } from "./get-web-session";
import { redirectTo } from "./redirect-to";

export async function redirectIfAuthenticated(next?: string | null) {
  const session = await getWebSession();
  const destination = resolveGuestOnlyRedirect(session !== null, next);

  if (destination !== null) {
    redirectTo(destination);
  }
}
