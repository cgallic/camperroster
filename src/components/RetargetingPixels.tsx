"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isTrackedPath } from "@/lib/analytics";

/**
 * KaiCalls retargeting pixels (Meta, Google Ads, TikTok, LinkedIn) from
 * /kc-pixels.js. Same rule as GA: public site and signup funnel only.
 *
 * These pixels cannot be switched off once loaded, and they watch history
 * changes and clicks. So after they load on a public page, any client-side hop
 * into a private page (camper, family, health or staff data) becomes a full
 * page load, which arrives without them.
 */
export default function RetargetingPixels() {
  const pathname = usePathname();
  const tracked = !!pathname && isTrackedPath(pathname);

  useEffect(() => {
    const w = window as any;
    if (!tracked) {
      // Back/forward into a private page while the pixels are running.
      // (Skipped when the guard below is already loading the private page.)
      if (w.fbq && !w.__kcPixelsLeaving) window.location.reload();
      return;
    }
    if (w.__kcPixelsGuard) return;
    w.__kcPixelsGuard = true;
    for (const method of ["pushState", "replaceState"] as const) {
      const original = history[method].bind(history);
      history[method] = (data: any, unused: string, url?: string | URL | null) => {
        if (url != null && w.fbq) {
          const next = new URL(String(url), window.location.href);
          if (next.origin === window.location.origin && !isTrackedPath(next.pathname)) {
            w.__kcPixelsLeaving = true;
            window.location.assign(next.href);
            return;
          }
        }
        return original(data, unused, url);
      };
    }
  }, [tracked]);

  if (!tracked) return null;
  return <Script id="kc-pixels" src="/kc-pixels.js" strategy="afterInteractive" />;
}
