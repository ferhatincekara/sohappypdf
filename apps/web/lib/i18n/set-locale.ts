"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { parseAppLocale } from "@/lib/i18n/resolve-locale";
import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
} from "@/lib/i18n/routing";

export async function setAppLocale(locale: string): Promise<void> {
  const nextLocale = parseAppLocale(locale);

  if (nextLocale === undefined) {
    return;
  }

  (await cookies()).set(LOCALE_COOKIE_NAME, nextLocale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
    httpOnly: true,
  });

  revalidatePath("/", "layout");
}
