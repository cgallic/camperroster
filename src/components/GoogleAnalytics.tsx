"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isTrackedPath } from "@/lib/analytics";

/** GA4 web stream for camperroster.com (property 554540656). Public by design. */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export default function GoogleAnalytics() {
  // No pathname (some error and not-found renders) means "don't know", so don't track.
  const pathname = usePathname();
  const tracked = !!pathname && isTrackedPath(pathname);

  // gtag stays loaded after a client-side hop into the app, so the official
  // ga-disable flag stops it sending anything from a private page.
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    (window as any)[`ga-disable-${GA_MEASUREMENT_ID}`] = !tracked;
  }, [tracked]);

  if (!GA_MEASUREMENT_ID || !tracked) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
