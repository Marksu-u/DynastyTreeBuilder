"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import {
  configureAnalytics,
  GA_MEASUREMENT_ID,
  GA_SCRIPT_URL,
  sendPageView,
} from "@/lib/analytics/gtag";
import { useConsent } from "./ConsentProvider";

function GoogleAnalyticsInner() {
  const { choice, ready } = useConsent();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const configured = useRef(false);

  const enabled = ready && choice === "granted" && GA_MEASUREMENT_ID !== "";

  const query = searchParams.toString();
  const path = query ? `${pathname}?${query}` : pathname;

  // Queue `js` and `config` before the tag is fetched. dataLayer replays
  // whatever accumulated while the script was in flight, so this runs safely
  // ahead of it — and the ref keeps a re-render from configuring twice.
  useEffect(() => {
    if (!enabled || configured.current) return;
    configureAnalytics(GA_MEASUREMENT_ID);
    configured.current = true;
  }, [enabled]);

  // App Router navigations never reload the document, so page views are sent
  // by hand. `send_page_view: false` in the config above means this effect
  // owns every view including the first, with no double count.
  useEffect(() => {
    if (!enabled) return;
    sendPageView(GA_MEASUREMENT_ID, path);
  }, [enabled, path]);

  if (!enabled) return null;

  return <Script src={GA_SCRIPT_URL} strategy="afterInteractive" />;
}

/**
 * Loads Google Analytics, and only once the visitor has said yes.
 *
 * The Suspense boundary is required: useSearchParams opts everything above it
 * out of static rendering, and this sits in the root layout — without it every
 * page in the app would become dynamic.
 */
export function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner />
    </Suspense>
  );
}
