"use client";

import { useEffect, useState } from "react";

const INITIAL_VISIBLE = 5;

type ProfileRow = {
  id: string;
  full_name: string;
  email: string | null;
  index_number: string | null;
  reference: string | null;
  is_pro: boolean;
  created_at: string;
};

export function AdminUsersPanel() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/profiles", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) setError("Session expired. Please sign in again.");
        else setError("Failed to load users");
        setProfiles([]);
        return;
      }
      const data = await res.json();
      setProfiles(data.profiles ?? []);
      setShowAll(false);
    } catch {
      setError("Failed to load users");
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const setPro = async (userId: string, isPro: boolean) => {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/profiles/${userId}/pro`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_pro: isPro }),
      });
      if (!res.ok) throw new Error("Update failed");
      await load();
    } catch {
      setError("Failed to update");
    } finally {
      setUpdating(null);
    }
  };

  const proCount = profiles.filter((p) => p.is_pro).length;
  const nonProCount = profiles.length - proCount;
  const showMore = profiles.length > INITIAL_VISIBLE && !showAll;
  const visibleProfiles = showMore ? profiles.slice(0, INITIAL_VISIBLE) : profiles;
  const hiddenCount = profiles.length - visibleProfiles.length;

  return (
    <div className="flex flex-col gap-4">
      {/* User counts */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="rounded-xl bg-slate-50 px-4 py-2">
          <span className="text-2xl font-bold text-slate-900">{profiles.length}</span>
          <span className="ml-1.5 text-sm font-medium text-slate-600">
            user{profiles.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="rounded-xl bg-amber-50 px-4 py-2">
          <span className="text-2xl font-bold text-amber-800">{proCount}</span>
          <span className="ml-1.5 text-sm font-medium text-amber-700">PRO</span>
        </div>
        <div className="rounded-xl bg-slate-100 px-4 py-2">
          <span className="text-2xl font-bold text-slate-700">{nonProCount}</span>
          <span className="ml-1.5 text-sm font-medium text-slate-600">not PRO</span>
        </div>
        <button
          type="button"
          onClick={load}
          className="ml-auto rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-orange-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {loading ? (
        <p className="py-4 text-center text-sm text-slate-500">Loading users...</p>
      ) : profiles.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">No users yet.</p>
      ) : (
        <>
          <div className="max-h-96 overflow-y-auto rounded-lg border border-orange-100">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="p-2 font-semibold text-slate-700">Name</th>
                  <th className="p-2 font-semibold text-slate-700">Email</th>
                  <th className="p-2 font-semibold text-slate-700">PRO</th>
                  <th className="p-2 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleProfiles.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="p-2">{p.full_name || "—"}</td>
                    <td className="p-2 text-slate-600">{p.email || "—"}</td>
                    <td className="p-2">
                      {p.is_pro ? (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                          Yes
                        </span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="p-2">
                      {updating === p.id ? (
                        <span className="text-xs text-slate-500">Updating...</span>
                      ) : p.is_pro ? (
                        <button
                          type="button"
                          onClick={() => setPro(p.id, false)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Revoke PRO
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPro(p.id, true)}
                          className="text-xs font-medium text-emerald-600 hover:underline"
                        >
                          Promote to PRO
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {showMore && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-800 hover:bg-orange-100"
            >
              Show more ({hiddenCount} more user{hiddenCount !== 1 ? "s" : ""})
            </button>
          )}
          {showAll && profiles.length > INITIAL_VISIBLE && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Show less
            </button>
          )}
        </>
      )}
    </div>
  );
}
