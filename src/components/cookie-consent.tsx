"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "watas_cookie_consent";

export type ConsentChoice = "accept" | "decline" | null;

export function CookieConsent() {
  const [choice, setChoice] = useState<ConsentChoice>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentChoice | null;
    if (stored === "accept" || stored === "decline") {
      setChoice(stored);
    }
    setMounted(true);
  }, []);

  const save = (value: ConsentChoice) => {
    if (value === null) return;
    localStorage.setItem(CONSENT_KEY, value);
    setChoice(value);
  };

  if (!mounted || choice === "accept" || choice === "decline") return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie and privacy consent"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:left-4 sm:right-auto sm:bottom-4 sm:max-w-md sm:rounded-2xl"
    >
      <p className="text-sm font-medium text-slate-900">
        We use cookies and similar data
      </p>
      <p className="mt-1 text-xs text-slate-600">
        We use your data to run the site (e.g. account, preferences), for
        analytics and to improve your experience. You can accept or decline
        non-essential tracking.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => save("accept")}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => save("decline")}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

export function getStoredConsent(): ConsentChoice {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(CONSENT_KEY);
  if (v === "accept" || v === "decline") return v;
  return null;
}
