// lib/analytics/ga-cookies.ts
// Pure helpers for finding and expiring the cookies gtag.js leaves behind.
//
// Withdrawing consent has to be as effective as never granting it, so a
// refusal after a previous acceptance must actually remove `_ga` and
// `_ga_<STREAM>` from the browser — not merely stop sending hits.
//
// A cookie can only be deleted by a Set-Cookie whose name, domain and path all
// match the original. gtag.js writes on the registrable domain with a leading
// dot, which we cannot read back from document.cookie, so we clear across every
// candidate domain rather than guessing the one it used.

/** Cookie names gtag.js owns: `_ga` and the per-stream `_ga_XXXXXXXXXX`. */
export function parseGaCookieNames(cookieString: string): string[] {
  return cookieString
    .split(";")
    .map((pair) => pair.split("=")[0]?.trim() ?? "")
    .filter((name) => name === "_ga" || name.startsWith("_ga_") || name === "_gid")
    .filter((name, index, all) => all.indexOf(name) === index);
}

/**
 * Every domain a `_ga` cookie could have been scoped to, widest last.
 * `null` means "send no Domain attribute" — the host-only cookie case.
 *
 * The final label pair is kept as a floor: for "app.bagofholding.tools" we try
 * ".app.bagofholding.tools" and ".bagofholding.tools" but never ".tools",
 * which no browser would have accepted in the first place.
 */
export function cookieClearDomains(hostname: string): (string | null)[] {
  const domains: (string | null)[] = [null];

  // An IP literal or a single-label host (localhost) has no parent domains.
  if (!hostname || /^[\d.]+$/.test(hostname) || hostname.includes(":")) return domains;

  const labels = hostname.split(".");
  for (let i = 0; i <= labels.length - 2; i++) {
    domains.push(`.${labels.slice(i).join(".")}`);
  }

  return domains;
}

/** The Set-Cookie strings that expire `name` across every candidate domain. */
export function expiredCookieStrings(name: string, hostname: string): string[] {
  return cookieClearDomains(hostname).map(
    (domain) =>
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/` +
      (domain ? `; domain=${domain}` : ""),
  );
}
