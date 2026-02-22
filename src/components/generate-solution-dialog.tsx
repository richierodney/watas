"use client";

import { useState, useRef, useEffect } from "react";
import { marked } from "marked";
import { useAuth } from "./auth-provider";
import { MarkdownRenderer } from "./markdown-renderer";
import { supabase } from "@/lib/supabase";

type Message = { role: "user" | "assistant"; content: string };

type AssignmentInfo = {
  title: string;
  courseCode: string;
  courseName: string;
  description?: string;
};

const INITIAL_PROMPT =
  "Produce the solution for this assignment. Follow the instructions exactly. Give only the required output (e.g. the full list or answer)—no introductions, no tips, no extra explanations. Go straight to the point.";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type GenerateSolutionDialogProps = {
  assignment: AssignmentInfo;
  open: boolean;
  onClose: () => void;
};

export function GenerateSolutionDialog({
  assignment,
  open,
  onClose,
}: GenerateSolutionDialogProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryAgreed, setSummaryAgreed] = useState(false);
  const [exportName, setExportName] = useState(profile?.full_name ?? "");
  const [exportIndex, setExportIndex] = useState(profile?.index_number ?? "");
  const [exportRef, setExportRef] = useState(profile?.reference ?? "");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(false);
  const hasTriggeredInitialRef = useRef(false);

  useEffect(() => {
    if (profile) {
      setExportName(profile.full_name);
      setExportIndex(profile.index_number ?? "");
      setExportRef(profile.reference ?? "");
    }
  }, [profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!open) return null;

  const assignmentContext = [
    `Assignment: ${assignment.title}`,
    `Course: ${assignment.courseCode} - ${assignment.courseName}`,
    assignment.description
      ? `Description:\n${assignment.description}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;
    const userMessage: Message = { role: "user", content: content.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          assignmentContext,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const text =
        typeof data.message === "string"
          ? data.message
          : data.message != null
            ? String(data.message)
            : "No response received.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: text },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const becameOpen = open && !prevOpenRef.current;
    prevOpenRef.current = open;
    if (becameOpen) {
      setMessages([]);
      setSummary(null);
      setSummaryAgreed(false);
      hasTriggeredInitialRef.current = false;
    }
    if (!open) hasTriggeredInitialRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open || messages.length > 0 || loading || hasTriggeredInitialRef.current) return;
    hasTriggeredInitialRef.current = true;
    sendMessage(INITIAL_PROMPT);
  }, [open, messages.length, loading]);

  const handleSummarize = async () => {
    if (messages.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummary(data.summary);
      setSummaryAgreed(false);
    } catch (e) {
      setSummary("Failed to generate summary. Please try again.");
      setSummaryAgreed(false);
    } finally {
      setLoading(false);
    }
  };

  const buildDocumentHtml = () => {
    const summaryHtml = marked.parse(summary!, { async: false }) as string;
    const lines: string[] = [];
    if (exportName.trim()) lines.push(`<p><strong>Name:</strong> ${escapeHtml(exportName.trim())}</p>`);
    if (exportIndex.trim()) lines.push(`<p><strong>Index:</strong> ${escapeHtml(exportIndex.trim())}</p>`);
    if (exportRef.trim()) lines.push(`<p><strong>Reference:</strong> ${escapeHtml(exportRef.trim())}</p>`);
    lines.push("<hr/>");
    lines.push("<div class=\"summary\">");
    lines.push(summaryHtml);
    lines.push("</div>");
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(assignment.title)} - Solution Summary</title>
  <style>
    body { font-family: Georgia, serif; max-width: 700px; margin: 2rem auto; padding: 1rem; line-height: 1.6; }
    .summary { white-space: pre-wrap; }
    hr { margin: 1.5rem 0; border: none; border-top: 1px solid #ccc; }
  </style>
</head>
<body>
  <h1>${escapeHtml(assignment.title)}</h1>
  <p><em>${escapeHtml(assignment.courseCode)} · ${escapeHtml(assignment.courseName)}</em></p>
  ${lines.join("\n")}
</body>
</html>`;
  };

  const downloadDoc = () => {
    if (!summary) return;
    const html = buildDocumentHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${assignment.title.replace(/[^a-z0-9]/gi, "_")}_solution.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => {
    if (!summary) return;
    const html = buildDocumentHtml();
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
    w.close();
  };

  const step = summary === null ? "chat" : summaryAgreed ? "export" : "agree";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Generate Solution — {assignment.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {step === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {messages.length === 0 && (
                <p className="text-sm text-slate-500">
                  Ask questions about this assignment. The AI will use the
                  assignment details as context.
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`mb-3 ${m.role === "user" ? "text-right" : ""}`}
                >
                  <span className="text-xs font-medium text-slate-500">
                    {m.role === "user" ? "You" : "Tutor"}
                  </span>
                  <div
                    className={
                      m.role === "user"
                        ? "inline-block rounded-lg bg-orange-100 px-3 py-2 text-sm text-slate-900"
                        : "rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800"
                    }
                  >
                    {m.role === "assistant" ? (
                      <MarkdownRenderer content={m.content} />
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <p className="text-sm text-slate-500">Thinking...</p>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2 border-t border-slate-200 p-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask a follow-up question..."
                className="flex-1 rounded-lg border border-orange-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={loading}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                Send
              </button>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleSummarize}
                  disabled={loading}
                  className="rounded-lg border border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                >
                  Summarize for doc
                </button>
              )}
            </div>
          </>
        )}

        {step === "agree" && summary !== null && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="overflow-y-auto px-4 py-3">
              <p className="mb-2 text-xs font-medium text-slate-600">
                Review the summary below. Important parts are kept; you can edit
                after exporting if needed.
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
                <MarkdownRenderer content={summary} />
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-200 p-3">
              <button
                type="button"
                onClick={() => setSummary(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back to chat
              </button>
              <button
                type="button"
                onClick={() => setSummaryAgreed(true)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                I agree — add my details & export
              </button>
            </div>
          </div>
        )}

        {step === "export" && (
          <div className="flex flex-1 flex-col overflow-hidden px-4 py-3">
            <p className="mb-2 text-xs font-medium text-slate-600">
              Add your name, index, and/or reference to appear on the document.
            </p>
            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-slate-500">Name</label>
                <input
                  type="text"
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500">Index</label>
                <input
                  type="text"
                  value={exportIndex}
                  onChange={(e) => setExportIndex(e.target.value)}
                  className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                  placeholder="Index number"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500">Reference</label>
                <input
                  type="text"
                  value={exportRef}
                  onChange={(e) => setExportRef(e.target.value)}
                  className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                  placeholder="Reference"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={printPdf}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Print / Save as PDF
              </button>
              <button
                type="button"
                onClick={downloadDoc}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Download as document (HTML)
              </button>
              <button
                type="button"
                onClick={() => { setSummary(null); setSummaryAgreed(false); }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Back to summary
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
