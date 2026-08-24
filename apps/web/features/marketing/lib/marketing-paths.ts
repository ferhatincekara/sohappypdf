import { AUTH_PATHS } from "@/features/auth/paths";
import { DEVELOPER_PATHS } from "@/features/developer-docs/config/developer-paths";

export const MARKETING_PATHS = {
  home: "/",
  pricing: "/pricing",
  developers: DEVELOPER_PATHS.docs,
  login: AUTH_PATHS.login,
  signup: AUTH_PATHS.signup,
  product: "/#product",
} as const;

export const PUBLIC_MARKETING_ROUTES = [
  MARKETING_PATHS.home,
  MARKETING_PATHS.pricing,
  MARKETING_PATHS.developers,
  MARKETING_PATHS.login,
  MARKETING_PATHS.signup,
] as const;
