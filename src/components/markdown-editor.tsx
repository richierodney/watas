"use client";

import { useState } from "react";
import { MarkdownRenderer } from "./markdown-renderer";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
};

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Add assignment details or instructions...",
  label,
  rows = 6,
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="block text-xs font-medium uppercase tracking-[0.1em] text-slate-700">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className={[
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            !showPreview
              ? "border-orange-400 bg-orange-50 text-orange-700"
              : "border-orange-200 bg-white text-slate-700 hover:bg-orange-50",
          ].join(" ")}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className={[
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            showPreview
              ? "border-orange-400 bg-orange-50 text-orange-700"
              : "border-orange-200 bg-white text-slate-700 hover:bg-orange-50",
          ].join(" ")}
        >
          Preview
        </button>
      </div>
      {showPreview ? (
        <div className="min-h-[120px] rounded-lg border border-orange-200 bg-white p-3">
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-sm text-slate-400 italic">{placeholder}</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 font-mono"
        />
      )}
      <p className="text-xs text-slate-500">
        Supports Markdown: **bold**, *italic*, lists, links, code blocks, etc.
      </p>
    </div>
  );
}

