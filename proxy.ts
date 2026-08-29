import { createServerClient } from "@supabase/ssr";
import { hasLocale } from "next-intl";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing, type Locale } from "./i18n/routing";

const handleI18n = createIntlMiddleware(routing);

/**
 * Splits `/fr/dashboard` into its locale and the route beneath it, so the auth
 * guards below can be written once against `/dashboard` rather than once per
 * locale. An unprefixed path is the default locale — that is what
 * `localePrefix: "as-needed"` means.
 */
function splitLocale(pathname: string): { locale: Locale; rest: string } {
  const segment = pathname.split("/")[1];
  if (hasLocale(routing.locales, segment)) {
    return { locale: segment, rest: pathname.slice(segment.length + 1) || "/" };
  }
  return { locale: routing.defaultLocale, rest: pathname };
}

/** Inverse of `splitLocale`: the default locale carries no prefix. */
function localizedPath(locale: Locale, path: string): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

export async function proxy(request: NextRequest) {
  // next-intl runs first: it decides the locale, and may answer on its own with
  // a redirect (no prefix → negotiated locale) or a rewrite (/fr/x → the
  // [locale] tree). Everything below writes onto whatever it returns, so the
  // Set-Cookie headers from the session refresh survive.
  const response = handleI18n(request);

  // A locale redirect is answered before the session is touched: the browser
  // follows it straight back into this proxy, which then does the refresh with
  // the final URL in hand.
  if (response.headers.has("location")) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Onto the next-intl response rather than a fresh one, so its rewrite
          // header is not thrown away along with the locale it resolved.
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — must not call getUser() after this without re-fetching
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { locale, rest } = splitLocale(request.nextUrl.pathname);

  // Protect /dashboard routes, in whichever locale they were requested
  if (!user && rest.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = localizedPath(locale, "/login");
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from /login
  if (user && rest === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = localizedPath(locale, "/dashboard");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Everything except Next internals, the API routes and static files.
  //
  // `/api` is excluded so next-intl never rewrites it under a locale: the auth
  // callback is a Route Handler, where `cookies()` is writable, so it completes
  // the session exchange itself without the refresh below.
  //
  // Every generated metadata route has to be listed here by name. They carry no
  // file extension, so the trailing `.*\\..*` guard does not catch them, and a
  // missing one is rewritten to `/en/icon` and serves a 404 — with the <link>
  // tag still present in the HTML, so nothing looks wrong until you open a tab
  // and see no icon.
  matcher: [
    "/((?!api|_next|_vercel|sitemap.xml|robots.txt|opengraph-image|icon|apple-icon|favicon.ico|.*\\..*).*)",
  ],
};
