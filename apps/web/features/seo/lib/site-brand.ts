export const SITE_NAME = "SoHappyPDF";
export const TITLE_TEMPLATE = `%s - ${SITE_NAME}`;

export const BRAND_ICON_192_PATH = "/brand/sohappypdf-icon-192.png";
export const BRAND_ICON_512_PATH = "/brand/sohappypdf-icon-512.png";
export const OPENGRAPH_IMAGE_PATH = "/opengraph-image.png";
export const OPENGRAPH_IMAGE_ALT = `${SITE_NAME} - online PDF tools`;

export const THEME_COLOR_LIGHT = "#ffffff";
export const THEME_COLOR_DARK = "#171717";

export function brandedTitle(title: string): string {
  return `${title} - ${SITE_NAME}`;
}
