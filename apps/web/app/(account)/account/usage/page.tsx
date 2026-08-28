import { APP_PATHS } from "@/features/app-shell";
import { redirectTo } from "@/features/auth/session/redirect-to";

export default function AccountUsageRedirectPage() {
  redirectTo(APP_PATHS.billing);
}
