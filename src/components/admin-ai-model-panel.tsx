"use client";

import { useEffect, useState } from "react";

const OPTIONS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-5", label: "GPT-5" },
] as const;

export function AdminAIModelPanel() {
  const [model, setModel] = useState<string>("gpt-4o");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ai-model", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) setError("Session expired.");
        else setError("Failed to load.");
        return;
      }
      const json = await res.json();
      setModel(json.model ?? "gpt-4o");
    } catch {
      setError("Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (newModel: string) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ai-model", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: newModel }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save.");
        return;
      }
      const json = await res.json();
      setModel(json.model ?? newModel);
    } catch {
      setError("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm font-medium text-slate-700">Model for Generate Solution & Summarize</label>
      <select
        value={model}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:opacity-50"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {saving && <span className="text-xs text-slate-500">Saving…</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
