// lib/analytics/gtag.ts
// The browser-facing half of Google Analytics. Nothing here runs until the
// visitor has granted consent — see lib/analytics/consent.ts.
import { expiredCookieStrings, parseGaCookieNames } from "./ga-cookies";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * A GA4 measurement ID: `G-` followed by ten alphanumerics. Worth checking,
 * because a truncated ID fails silently — gtag.js loads, accepts every hit and
 * reports nothing, which looks identical to "no traffic yet".
 */
export function isMeasurementId(value: string | undefined): value is string {
  return typeof value === "string" && /^G-[A-Z0-9]{10}$/.test(value);
}

const RAW_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

/** Empty when unset or malformed, which switches analytics off entirely. */
export const GA_MEASUREMENT_ID = isMeasurementId(RAW_MEASUREMENT_ID)
  ? RAW_MEASUREMENT_ID
  : "";

if (process.env.NODE_ENV === "development" && RAW_MEASUREMENT_ID && !GA_MEASUREMENT_ID) {
  console.warn(
    `[analytics] NEXT_PUBLIC_GA_ID="${RAW_MEASUREMENT_ID}" is not a GA4 measurement ID ` +
      `(expected G- followed by ten characters). Analytics is disabled.`,
  );
}

export const GA_SCRIPT_URL = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

/**
 * Google's own snippet, in TypeScript. The queue exists before gtag.js loads,
 * so calls made in the same tick as the <Script> tag are replayed rather than
 * dropped — which is why the first page_view is never lost to a race.
 *
 * gtag.js replays each entry as an `arguments` object; pushing a plain array
 * is not equivalent, so `arguments` is deliberate here.
 */
export function ensureGtag(): NonNullable<Window["gtag"]> {
  window.dataLayer ??= [];
  window.gtag ??= function gtag() {
    // eslint-disable-next-line prefer-rest-params
    (window.dataLayer ??= []).push(arguments);
  };
  return window.gtag;
}

/** 13 months in seconds — the CNIL's ceiling for a tracker's lifetime. */
export const GA_COOKIE_LIFETIME_SECONDS = 34_128_000;

export function configureAnalytics(measurementId: string): void {
  const gtag = ensureGtag();
  gtag("js", new Date());
  gtag("config", measurementId, {
    // The App Router navigates without a document load, so gtag.js would count
    // the first view and then nothing else. Views are sent by hand instead.
    send_page_view: false,
    // GA4 defaults `_ga` to two years, which is longer than the Cookie Policy
    // says and longer than the CNIL allows. Keep the two in step.
    cookie_expires: GA_COOKIE_LIFETIME_SECONDS,
  });
  // GA4 truncates IPs on collection, so there is no anonymize_ip to set here.
}

export function sendPageView(measurementId: string, path: string): void {
  ensureGtag()("event", "page_view", {
    send_to: measurementId,
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: document.title,
  });
}

/**
 * Withdrawal. The `ga-disable-<ID>` flag is gtag.js's documented kill switch and
 * is honoured even once the script has loaded, so a visitor who changes their
 * mind mid-session stops being measured without a reload; the cookies go too.
 */
export function disableAnalytics(measurementId: string): void {
  if (typeof window === "undefined") return;

  if (measurementId) {
    (window as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = true;
  }
  clearGaCookies();
}

export function clearGaCookies(): void {
  if (typeof document === "undefined") return;

  for (const name of parseGaCookieNames(document.cookie)) {
    for (const directive of expiredCookieStrings(name, window.location.hostname)) {
      document.cookie = directive;
    }
  }
}
