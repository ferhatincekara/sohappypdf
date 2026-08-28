import { AUTH_PATHS } from "@/features/auth/paths";
import { DEVELOPER_PATHS } from "@/features/developer-docs/config/developer-paths";
import { LEGAL_PATHS } from "@/features/legal/lib/legal-paths";

export const MARKETING_PATHS = {
  home: "/",
  tools: "/tools",
  pricing: "/pricing",
  faq: "/faq",
  blog: "/blog",
  about: "/about",
  contact: "/contact",
  developers: DEVELOPER_PATHS.docs,
  login: AUTH_PATHS.login,
  signup: AUTH_PATHS.signup,
  security: LEGAL_PATHS.security,
  privacy: LEGAL_PATHS.privacy,
  terms: LEGAL_PATHS.terms,
  cookies: LEGAL_PATHS.cookies,
  product: "/#product",
} as const;

export const PUBLIC_MARKETING_ROUTES = [
  MARKETING_PATHS.home,
  MARKETING_PATHS.tools,
  MARKETING_PATHS.pricing,
  MARKETING_PATHS.faq,
  MARKETING_PATHS.blog,
  MARKETING_PATHS.about,
  MARKETING_PATHS.contact,
  MARKETING_PATHS.developers,
  MARKETING_PATHS.login,
  MARKETING_PATHS.signup,
  MARKETING_PATHS.security,
  MARKETING_PATHS.privacy,
  MARKETING_PATHS.terms,
  MARKETING_PATHS.cookies,
] as const;
