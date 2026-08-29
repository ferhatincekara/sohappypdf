import type { MetadataRoute } from "next";
import {
  BRAND_ICON_192_PATH,
  BRAND_ICON_512_PATH,
  SITE_NAME,
  THEME_COLOR_LIGHT,
} from "@/features/seo/lib/site-brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description:
      "Merge, split, compress, convert, OCR, and protect PDFs online.",
    start_url: "/",
    display: "standalone",
    background_color: THEME_COLOR_LIGHT,
    theme_color: THEME_COLOR_LIGHT,
    icons: [
      {
        src: BRAND_ICON_192_PATH,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: BRAND_ICON_512_PATH,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
