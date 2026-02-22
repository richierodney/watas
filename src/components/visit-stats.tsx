"use client";

import { useEffect, useState } from "react";
import { getVisitStats, type VisitStats } from "@/lib/db-helpers";

export function VisitStats() {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await getVisitStats();
    setStats(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-orange-100">
        <p className="text-center text-sm text-slate-500">Loading stats...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-orange-100">
        <p className="text-center text-sm text-red-600">
          Failed to load visit statistics.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-orange-100 bg-white/60 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">
            Total Visits
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {stats.total.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-orange-100 bg-white/60 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">
            Today
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">
            {stats.today.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-orange-100 bg-white/60 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">
            This Week
          </p>
          <p className="mt-1 text-2xl font-semibold text-orange-700">
            {stats.thisWeek.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-orange-100 bg-white/60 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">
            This Month
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">
            {stats.thisMonth.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Visits by Page */}
      <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-orange-100">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Visits by Page
        </h3>
        <div className="flex flex-col gap-2">
          {stats.byPage.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">
              No page visits yet.
            </p>
          ) : (
            stats.byPage.map((item) => (
              <div
                key={item.page}
                className="flex items-center justify-between rounded-lg border border-orange-100 bg-white/60 px-3 py-2"
              >
                <span className="text-sm font-medium text-slate-900">
                  {item.page}
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {item.count}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Visits */}
      <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-orange-100">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Recent Visits
        </h3>
        <div className="flex flex-col gap-2">
          {stats.recent.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">
              No recent visits.
            </p>
          ) : (
            stats.recent.map((visit, index) => (
              <div
                key={index}
                className="flex flex-col gap-1 rounded-lg border border-orange-100 bg-white/60 px-3 py-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">
                    {visit.page}
                  </span>
                  <span className="text-slate-500">
                    {new Date(visit.visited_at).toLocaleString()}
                  </span>
                </div>
                {visit.user_agent && (
                  <p className="truncate text-slate-500">
                    {visit.user_agent.substring(0, 80)}
                    {visit.user_agent.length > 80 ? "..." : ""}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={loadStats}
        className="rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-orange-50"
      >
        Refresh Stats
      </button>
    </div>
  );
}








