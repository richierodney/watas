"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

export function DashboardHeader() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-orange-100 pb-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          WATAs
        </Link>
        {profile?.is_pro && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            PRO
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!loading && (
          <>
            {user ? (
              <>
                <span className="flex items-center gap-1.5 text-sm text-slate-600">
                  {profile?.is_pro && (
                    <span className="inline-flex text-amber-500" title="PRO" aria-hidden>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 2H5v2h14v-2z" />
                      </svg>
                    </span>
                  )}
                  {profile?.full_name ?? user.email}
                </span>
                {!profile?.is_pro && (
                  <Link
                    href="/pro"
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                  >
                    Upgrade to PRO
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
              >
                Sign in
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  );
}
