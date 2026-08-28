import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { resolveAppLocale } from "./resolve-locale";
import { LOCALE_COOKIE_NAME } from "./routing";

export default getRequestConfig(async () => {
  const locale = resolveAppLocale({
    cookieLocale: (await cookies()).get(LOCALE_COOKIE_NAME)?.value,
    acceptLanguage: (await headers()).get("accept-language"),
  });

  return {
    locale,
    now: new Date(),
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
