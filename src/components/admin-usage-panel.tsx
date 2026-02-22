"use client";

import { useEffect, useState } from "react";

type UsageOverall = {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
};

type PerUser = {
  user_id: string;
  full_name: string;
  totalRequests: number;
  inputTokens: number;
  outputTokens: number;
};

type UsageData = {
  overall: UsageOverall;
  perUser: PerUser[];
};

export function AdminUsagePanel() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/usage", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) setError("Session expired. Please sign in again.");
        else setError("Failed to load usage");
        setData(null);
        return;
      }
      const json = await res.json();
      setData({ overall: json.overall, perUser: json.perUser ?? [] });
    } catch {
      setError("Failed to load usage");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="py-4 text-center text-sm text-slate-500">Loading usage...</p>;
  }
  if (error) {
    return (
      <div>
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-2 text-xs text-orange-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!data) {
    return <p className="py-4 text-center text-sm text-slate-500">No data.</p>;
  }

  const { overall, perUser } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-2xl font-semibold text-slate-900">{overall.totalRequests}</p>
          <p className="text-xs text-slate-500">Total requests</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-2xl font-semibold text-slate-900">
            {overall.totalInputTokens.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">Input tokens</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-2xl font-semibold text-slate-900">
            {overall.totalOutputTokens.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">Output tokens</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-600">Usage by user</p>
        <button
          type="button"
          onClick={load}
          className="text-xs text-orange-600 hover:underline"
        >
          Refresh
        </button>
      </div>
      {perUser.length === 0 ? (
        <p className="py-2 text-center text-xs text-slate-500">No usage recorded yet.</p>
      ) : (
        <div className="max-h-48 overflow-y-auto rounded border border-slate-100 text-xs">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                <th className="p-1.5 font-semibold text-slate-700">Name</th>
                <th className="p-1.5 font-semibold text-slate-700">Requests</th>
                <th className="p-1.5 font-semibold text-slate-700">In</th>
                <th className="p-1.5 font-semibold text-slate-700">Out</th>
              </tr>
            </thead>
            <tbody>
              {perUser.map((u) => (
                <tr key={u.user_id} className="border-t border-slate-100">
                  <td className="p-1.5">{u.full_name || "—"}</td>
                  <td className="p-1.5">{u.totalRequests}</td>
                  <td className="p-1.5 text-slate-600">{u.inputTokens.toLocaleString()}</td>
                  <td className="p-1.5 text-slate-600">{u.outputTokens.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
