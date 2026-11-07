"use client";

import { Analytics } from "@vercel/analytics/next";
import type { BeforeSendEvent } from "@vercel/analytics";

/** Set on the owner's own devices so their visits aren't counted. */
const OPT_OUT_KEY = "brewmap-no-analytics";
/** Open any page with ?no-analytics=1 once per device (=0 to count it again). */
const OPT_OUT_PARAM = "no-analytics";

/**
 * Vercel Web Analytics: page views only, no cookies. The query string is cut
 * from every URL, so what people type into search (?search=…) never leaves
 * the browser.
 */
export function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  let url: URL;
  try {
    url = new URL(event.url);
  } catch {
    return { ...event, url: event.url.split(/[?#]/)[0] };
  }
  try {
    const flag = url.searchParams.get(OPT_OUT_PARAM);
    if (flag === "1") localStorage.setItem(OPT_OUT_KEY, "1");
    if (flag === "0") localStorage.removeItem(OPT_OUT_KEY);
    if (localStorage.getItem(OPT_OUT_KEY)) return null;
  } catch {
    // Storage blocked (private mode): count the visit.
  }
  return { ...event, url: url.origin + url.pathname };
}

export function SiteAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
