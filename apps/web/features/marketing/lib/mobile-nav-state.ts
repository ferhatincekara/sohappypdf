export const MOBILE_NAV_ACTIONS = [
  "open",
  "close",
  "toggle",
  "escape",
  "navigate",
] as const;

export type MobileNavAction = (typeof MOBILE_NAV_ACTIONS)[number];

export function resolveMobileNavOpen(
  isOpen: boolean,
  action: MobileNavAction,
): boolean {
  switch (action) {
    case "open":
      return true;
    case "close":
    case "escape":
    case "navigate":
      return false;
    case "toggle":
      return !isOpen;
  }
}

export function isMobileNavEscapeKey(key: string): boolean {
  return key === "Escape";
}
