import {
  ActivityIcon,
  CreditCardIcon,
  KeyRoundIcon,
  type LucideIcon,
  SettingsIcon,
} from "lucide-react";
import { APP_PATHS, type AppPath } from "./app-paths";

export const APP_NAV_IDS = [
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
