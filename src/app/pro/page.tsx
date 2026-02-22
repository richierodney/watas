"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

function CheckIcon() {
  return (
    <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12" aria-hidden>
        <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
      </svg>
    </span>
  );
}

export default function ProPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [callbackStatus, setCallbackStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [callbackError, setCallbackError] = useState<string | null>(null);

  const handlePaymentCallback = useCallback(async (reference: string) => {
    setCallbackStatus("verifying");
    setCallbackError(null);
    try {
      const res = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCallbackError(data.error || "Verification failed");
        setCallbackStatus("error");
        return;
      }
      setCallbackStatus("success");
      await refreshProfile();
      window.location.href = "/";
    } catch {
      setCallbackError("Network error");
      setCallbackStatus("error");
    }
  }, [refreshProfile]);

  useEffect(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const reference = params?.get("reference");
    if (reference && callbackStatus === "idle") {
      handlePaymentCallback(reference);
    }
  }, [callbackStatus, handlePaymentCallback]);

  const startPaystackCheckout = async () => {
    if (!user) return;
    setPayLoading(true);
    setPayError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setPayError("Not signed in");
        setPayLoading(false);
        return;
      }
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          callbackBaseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPayError(data.error || "Could not start payment");
        setPayLoading(false);
        return;
      }
      const url = data.authorization_url;
      if (url) window.location.href = url;
      else setPayError("Invalid response");
    } catch {
      setPayError("Network error");
    } finally {
      setPayLoading(false);
    }
  };

  const isPro = Boolean(profile?.is_pro);
  const paystackReady = Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-medium text-orange-600 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">
          Compare plans
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          WATAs PRO gives you GPT-powered solutions for assignments at a fraction of the cost of ChatGPT.
        </p>

        {callbackStatus === "verifying" && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-700">
            Verifying your payment…
          </div>
        )}
        {callbackStatus === "success" && (
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-center text-sm font-medium text-emerald-800">
            Payment successful. You now have PRO. Redirecting…
          </div>
        )}
        {callbackStatus === "error" && callbackError && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-center text-sm text-red-800">
            {callbackError}
          </div>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:gap-8">
          {/* Free plan card */}
          <div className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
            <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Free
            </div>
            <div className="mt-4 text-2xl font-bold text-slate-900">
              $0 <span className="text-base font-normal text-slate-500">/ month</span>
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <CheckIcon />
                <span>View all assignments with due dates</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <CheckIcon />
                <span>Filter by group and course</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <CheckIcon />
                <span>Mark assignments as done (signed-in users)</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <CheckIcon />
                <span>Support & suggestions form</span>
              </li>
            </ul>
            {!isPro && (
              <p className="mt-6 text-center text-xs text-slate-500">
                Current plan
              </p>
            )}
          </div>

          {/* PRO plan card - highlighted */}
          <div className="relative flex flex-col rounded-2xl bg-gradient-to-b from-orange-50 to-rose-50/80 p-6 shadow-md ring-2 ring-orange-200/90">
            <div className="absolute right-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              PRO
            </div>
            <div className="text-sm font-semibold uppercase tracking-wider text-orange-800/90">
              WATAs PRO
            </div>
            <div className="mt-4 text-2xl font-bold text-slate-900">
              GH¢20 <span className="text-base font-normal text-slate-600">/ month</span>
            </div>
            <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-700">
              <strong>Comparison:</strong> ChatGPT is GH¢220 ($20)/mo. Get the same GPT power for assignments at <strong>GH¢20/mo</strong> with WATAs PRO.
            </p>

            {paystackReady && user && !isPro ? (
              <button
                type="button"
                onClick={startPaystackCheckout}
                disabled={payLoading}
                className="mt-6 w-full rounded-xl bg-[#e07c5e] py-3 text-base font-semibold text-white shadow-sm hover:bg-[#c96b4f] disabled:opacity-50"
              >
                {payLoading ? "Redirecting…" : "BUY"}
              </button>
            ) : isPro ? (
              <button
                type="button"
                disabled
                className="mt-6 w-full cursor-not-allowed rounded-xl bg-slate-300 py-3 text-base font-semibold text-slate-500"
              >
                You&apos;re already a PRO user
              </button>
            ) : !user ? (
              <p className="mt-6 text-center text-sm text-slate-600">
                <Link href="/auth" className="font-semibold text-orange-600 hover:underline">
                  Sign in
                </Link>{" "}
                to upgrade.
              </p>
            ) : null}

            {payError && (
              <p className="mt-2 text-center text-sm text-red-600">{payError}</p>
            )}

            <ul className="mt-6 flex-1 space-y-3">
              <li className="flex items-start gap-3 text-sm text-slate-800">
                <CheckIcon />
                <span><strong>Generate Solution</strong> on every assignment</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-800">
                <CheckIcon />
                <span>Chat with AI tutor (GPT-5), then export to document</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-800">
                <CheckIcon />
                <span>Export with your name, index & reference to PDF or HTML</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-800">
                <CheckIcon />
                <span>All Free plan benefits included</span>
              </li>
            </ul>

            {!paystackReady && !isPro && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                Payment setup in progress. An admin can promote you to PRO in the meantime.
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Need help? Contact support or ask an admin to promote you to PRO.
        </p>
      </div>
    </div>
  );
}
