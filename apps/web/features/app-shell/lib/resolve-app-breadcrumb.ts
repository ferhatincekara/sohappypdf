import { APP_PATHS } from "../config/app-paths";
import { APP_NAVIGATION, type AppNavItem } from "../config/navigation";
import { isNavItemActive } from "./is-nav-item-active";

export function resolveAppBreadcrumb(pathname: string): AppNavItem {
  const match = [...APP_NAVIGATION]
    .reverse()
    .find((item) => isNavItemActive(pathname, item.href));

  if (match !== undefined) {
    return match;
  }

  const overview = APP_NAVIGATION.find(
    (item) => item.href === APP_PATHS.overview,
  );

  if (overview === undefined) {
    throw new Error("Overview navigation item is required");
  }

  return overview;
}
