import { resolveGuestOnlyRedirect } from "@/features/auth/safe-redirect";
import { getWebSession } from "@/features/auth/session/get-web-session";
import { redirectTo } from "@/features/auth/session/redirect-to";

export async function redirectIfAuthenticated(next?: string | null) {
  const session = await getWebSession();
  const destination = resolveGuestOnlyRedirect(session !== null, next);

  if (destination !== null) {
    redirectTo(destination);
  }
}
