import { useEffect } from "react";
import { trackPageVisit } from "@/lib/db-helpers";

export function usePageVisit(pagePath: string) {
  useEffect(() => {
    // Only track on client side
    if (typeof window === "undefined") return;

    // Track the visit
    trackPageVisit(
      pagePath,
      navigator.userAgent,
      document.referrer || undefined,
    ).catch((error) => {
      console.error("Failed to track page visit:", error);
    });
  }, [pagePath]);
}

