import {
  ActivityIcon,
  BadgeCheckIcon,
  CreditCardIcon,
  GaugeIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  SettingsIcon,
} from "lucide-react";
import { APP_PATHS, type AppPath } from "./app-paths";

export const APP_NAV_IDS = [
  "overview",
  "usage",
  "plan",
  "activity",
  "billing",
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
    id: "usage",
    href: APP_PATHS.usage,
    icon: GaugeIcon,
  },
  {
    id: "plan",
    href: APP_PATHS.plan,
    icon: BadgeCheckIcon,
  },
  {
    id: "activity",
    href: APP_PATHS.activity,
    icon: ActivityIcon,
  },
  {
    id: "billing",
    href: APP_PATHS.billing,
    icon: CreditCardIcon,
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
