"use client";

import { useEffect, useState } from "react";
import { getGroups, updateGroup, type Group, type GroupId } from "@/lib/db-helpers";

export function GroupManager() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    const data = await getGroups();
    setGroups(data);
    setLoading(false);
  };

  const toggleGroup = async (id: GroupId) => {
    const group = groups.find((g) => g.id === id);
    if (!group) return;
    const updated = await updateGroup(id, !group.enabled);
    if (updated) {
      await loadGroups();
    } else {
      alert("Failed to update group. Please check your Supabase connection.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">
        Enable or disable groups to control which assignments are visible to
        students.
      </p>
      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="py-4 text-center text-sm text-slate-500">Loading...</p>
        ) : (
          groups.map((group) => (
          <div
            key={group.id}
            className="flex items-center justify-between rounded-lg border border-orange-100 bg-white/60 px-4 py-3"
          >
            <span className="text-sm font-medium text-slate-900">
              {group.id}
            </span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={group.enabled}
                onChange={() => toggleGroup(group.id)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-200"></div>
            </label>
          </div>
          ))
        )}
      </div>
      <p className="text-xs text-slate-500">
        {groups.filter((g) => g.enabled).length} of {groups.length} groups
        enabled
      </p>
    </div>
  );
}

