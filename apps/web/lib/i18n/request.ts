import { headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { resolveLocaleFromAcceptLanguage } from "./resolve-locale";

export default getRequestConfig(async () => {
  const locale = resolveLocaleFromAcceptLanguage(
    (await headers()).get("accept-language"),
  );

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
