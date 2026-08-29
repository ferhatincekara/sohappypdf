import { APP_PATHS } from "@/features/app-shell/config/app-paths";

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === APP_PATHS.settings) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
