"use client";

import { useEffect, useState } from "react";
import {
  getSupportRequests,
  type SupportRequest,
} from "@/lib/db-helpers";

export function SupportRequestsPanel() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const data = await getSupportRequests();
    setRequests(data);
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          See what students are asking for: missing assignments, fixes, and new
          ideas.
        </p>
        <button
          type="button"
          onClick={loadRequests}
          className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="py-4 text-center text-sm text-slate-500">
          Loading support requests...
        </p>
      ) : requests.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          No support requests yet.
        </p>
      ) : (
        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
          {requests.map((req) => (
            <article
              key={req.id}
              className="flex flex-col gap-1 rounded-lg border border-emerald-100 bg-white/70 px-3 py-2 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                  {req.support_type}
                </span>
                <span className="text-[0.7rem] text-slate-500">
                  {new Date(req.created_at).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-slate-700">
                {req.description}
              </p>
              {(req.contact_whatsapp || req.contact_phone) && (
                <div className="mt-1 flex flex-wrap gap-3 text-[0.7rem] text-slate-500">
                  {req.contact_whatsapp && (
                    <span>
                      WhatsApp:{" "}
                      <span className="font-medium text-slate-700">
                        {req.contact_whatsapp}
                      </span>
                    </span>
                  )}
                  {req.contact_phone && (
                    <span>
                      Phone:{" "}
                      <span className="font-medium text-slate-700">
                        {req.contact_phone}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}






