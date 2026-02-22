"use client";

import { useState } from "react";

type AdminAuthProps = {
  onAuthenticated: () => void;
};

export function AdminAuth({ onAuthenticated }: AdminAuthProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Incorrect password");
        setPassword("");
        return;
      }
      sessionStorage.setItem("admin_authenticated", "true");
      onAuthenticated();
    } catch {
      setError("Something went wrong");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFF8F0] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/90 p-8 shadow-lg ring-1 ring-orange-100">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">
          Admin Access
        </h1>
        <p className="mb-6 text-sm text-slate-600">
          Enter the admin password to manage assignments and courses.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs font-medium uppercase tracking-[0.1em] text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="w-full rounded-lg border border-orange-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-0 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              placeholder="Enter admin password"
              autoFocus
            />
            {error && (
              <p className="mt-1.5 text-xs text-red-600">{error}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}








