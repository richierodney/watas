"use client";

import { useState } from "react";
import { createSupportRequest } from "@/lib/db-helpers";

const SUPPORT_TYPES = [
  "Missing Assignment",
  "Correction",
  "Feature Idea",
  "Bug / Issue",
  "Other",
] as const;

type SupportType = (typeof SUPPORT_TYPES)[number];

export function SupportRequestForm() {
  const [supportType, setSupportType] = useState<SupportType>("Missing Assignment");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setStatus("error");
      return;
    }
    setSubmitting(true);
    setStatus("idle");
    const result = await createSupportRequest(
      supportType,
      whatsapp.trim() || undefined,
      phone.trim() || undefined,
      description.trim(),
    );
    setSubmitting(false);
    if (result) {
      setStatus("success");
      setDescription("");
      // keep contact + type so user doesn't have to re-enter
    } else {
      setStatus("error");
    }
  };

  return (
    <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Bring My Mind To An Assignment
        </h2>
        <p className="text-xs text-emerald-900/80">
          Missing assignment? Something unclear? Suggest an improvement or new
          feature. This goes straight to the admin dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs sm:text-sm">
        <div className="flex flex-col gap-1">
          <label className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-900">
            Type of Support
          </label>
          <div className="flex flex-wrap gap-2">
            {SUPPORT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSupportType(type)}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  supportType === type
                    ? "border-emerald-500 bg-emerald-600 text-white"
                    : "border-emerald-100 bg-white text-emerald-800 hover:bg-emerald-50",
                ].join(" ")}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-900">
              WhatsApp (Optional)
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+233 55 000 0000"
              className="rounded-lg border border-emerald-100 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-900">
              Phone (Optional)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Alt. phone number"
              className="rounded-lg border border-emerald-100 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-900">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us which assignment, course, or feature you have in mind. Include due date, group, and any links if helpful."
            rows={4}
            className="w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            required
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {submitting ? "Sending..." : "Send to Admin"}
          </button>
          {status === "success" && (
            <span className="text-[0.7rem] text-emerald-800">
              Thank you — your note has been sent.
            </span>
          )}
          {status === "error" && (
            <span className="text-[0.7rem] text-red-600">
              Something went wrong. Please check your message and try again.
            </span>
          )}
        </div>
      </form>
    </section>
  );
}






