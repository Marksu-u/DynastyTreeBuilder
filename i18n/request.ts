import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

// Resolves the locale for each server render and loads its messages.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  // `hasLocale` guards against a bogus segment such as /de/tree before it
  // reaches the import below, which would otherwise throw on a missing file.
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
