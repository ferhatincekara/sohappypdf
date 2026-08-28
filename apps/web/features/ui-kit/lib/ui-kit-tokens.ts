export const UI_KIT_COLOR_TOKENS = [
  "background",
  "foreground",
  "primary",
  "primary-hover",
  "secondary",
  "secondary-hover",
  "muted",
  "accent",
  "destructive",
  "border",
] as const;

export type UiKitColorToken = (typeof UI_KIT_COLOR_TOKENS)[number];
