import {
  FilesIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  RefreshCwIcon,
  SettingsIcon,
} from "lucide-react";
import { APP_PATHS, type AppPath } from "./app-paths";

export const APP_NAV_IDS = [
  "overview",
  "files",
  "conversions",
  "apiKeys",
  "settings",
] as const;

export type AppNavItemId = (typeof APP_NAV_IDS)[number];

export type AppNavItem = {
  id: AppNavItemId;
  href: AppPath;
  icon: LucideIcon;
};

export const APP_NAVIGATION: readonly AppNavItem[] = [
  {
    id: "overview",
    href: APP_PATHS.overview,
    icon: LayoutDashboardIcon,
  },
  {
    id: "files",
    href: APP_PATHS.files,
    icon: FilesIcon,
  },
  {
    id: "conversions",
    href: APP_PATHS.conversions,
    icon: RefreshCwIcon,
  },
  {
    id: "apiKeys",
    href: APP_PATHS.apiKeys,
    icon: KeyRoundIcon,
  },
  {
    id: "settings",
    href: APP_PATHS.settings,
    icon: SettingsIcon,
  },
];

export const PRIMARY_APP_NAVIGATION = APP_NAVIGATION.filter(
  (item) => item.id !== "settings",
);

export const SECONDARY_APP_NAVIGATION = APP_NAVIGATION.filter(
  (item) => item.id === "settings",
);
