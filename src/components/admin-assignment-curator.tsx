"use client";

import { useState } from "react";
import { MarkdownRenderer } from "./markdown-renderer";

type EditItem = { type: string; from?: string; to?: string };

type AdminAssignmentCuratorProps = {
  onAcceptDraft: (curatedText: string) => void;
};

export function AdminAssignmentCurator({ onAcceptDraft }: AdminAssignmentCuratorProps) {
  const [rawText, setRawText] = useState("");
  const [curatedText, setCuratedText] = useState<string | null>(null);
  const [edits, setEdits] = useState<EditItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCurate = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setError("");
    setCuratedText(null);
    setEdits([]);
    try {
      const res = await fetch("/api/ai/curate-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: rawText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Curate failed");
      setCuratedText(data.curatedText ?? "");
      setEdits(data.edits ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (curatedText) {
      onAcceptDraft(curatedText);
      setCuratedText(null);
      setEdits([]);
    }
  };

  const handleReject = () => {
    setCuratedText(null);
    setEdits([]);
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-900">
          Curate assignment text with AI
        </h3>
        <p className="text-xs text-amber-800/80">
          Paste raw text; AI will turn it into a clear assignment question. Review
          edits, then accept to use as description below.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-amber-900">
          Raw text
        </label>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste or type the assignment text to curate..."
          rows={4}
          className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
          disabled={loading}
        />
        <button
          type="button"
          onClick={handleCurate}
          disabled={loading || !rawText.trim()}
          className="mt-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? "Curating..." : "Curate with AI"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {curatedText !== null && (
        <div className="flex flex-col gap-3 border-t border-amber-200 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900">
            Review draft
          </h4>

          {edits.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-white p-3">
              <p className="mb-2 text-xs font-medium text-slate-600">
                Edits (highlight)
              </p>
              <ul className="list-inside list-disc space-y-1 text-xs text-slate-700">
                {edits.map((e, i) => (
                  <li key={i}>
                    {e.type === "deleted" && (
                      <span>
                        <span className="font-medium text-red-700">Deleted:</span>{" "}
                        <span className="line-through text-slate-600">
                          {e.from ?? e.to ?? ""}
                        </span>
                      </span>
                    )}
                    {e.type === "edited" && (
                      <span>
                        <span className="font-medium text-amber-700">Edited:</span>{" "}
                        <span className="line-through text-slate-500">
                          {e.from}
                        </span>
                        {" → "}
                        <span className="text-emerald-700">{e.to}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-amber-200 bg-white p-3">
            <p className="mb-2 text-xs font-medium text-slate-600">
              Curated text (use as description)
            </p>
            <div className="max-h-48 overflow-y-auto text-sm text-slate-800">
              <MarkdownRenderer content={curatedText} />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Accept draft → use below
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
