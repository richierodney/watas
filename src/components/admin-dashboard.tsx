"use client";

import { useEffect, useState } from "react";
import { AdminAuth } from "./admin-auth";
import { CourseManager } from "./course-manager";
import { GroupManager } from "./group-manager";
import { AssignmentCreator } from "./assignment-creator";
import { VisitStats } from "./visit-stats";
import { SupportRequestsPanel } from "./support-requests-panel";
import { AdminUsersPanel } from "./admin-users-panel";
import { AdminUsagePanel } from "./admin-usage-panel";
import { AdminAIModelPanel } from "./admin-ai-model-panel";
import { AdminAssignmentCurator } from "./admin-assignment-curator";

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [draftDescriptionForAssignment, setDraftDescriptionForAssignment] = useState<string | null>(null);

  useEffect(() => {
    const isAuth = sessionStorage.getItem("admin_authenticated") === "true";
    setAuthenticated(isAuth);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    setAuthenticated(false);
  };

  if (!authenticated) {
    return <AdminAuth onAuthenticated={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-8 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-700/70">
                Admin Panel
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                WATAs — Management
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-orange-50"
            >
              Logout
            </button>
          </div>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Manage courses, groups, and assignments for the assignment tracker.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-orange-100">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Course Manager
            </h2>
            <CourseManager />
          </section>

          <section className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-orange-100">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Group Manager
            </h2>
            <GroupManager />
          </section>

          <section className="lg:col-span-2 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-orange-100">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Assignment Creator
            </h2>
            <AdminAssignmentCurator
              onAcceptDraft={(text) => setDraftDescriptionForAssignment(text)}
            />
            <div className="mt-4 border-t border-orange-100 pt-4">
              <AssignmentCreator
                initialDescription={draftDescriptionForAssignment}
                onInitialDescriptionUsed={() => setDraftDescriptionForAssignment(null)}
              />
            </div>
          </section>

          <section className="lg:col-span-2 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-orange-100">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Users & PRO
            </h2>
            <AdminUsersPanel />
          </section>

          <section className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-orange-100">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              AI model
            </h2>
            <AdminAIModelPanel />
          </section>

          <section className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-orange-100">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              API key usage
            </h2>
            <AdminUsagePanel />
          </section>

          <section className="lg:col-span-2 grid gap-6 rounded-2xl bg-transparent p-0 sm:grid-cols-2 sm:p-0">
            <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-orange-100">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                Visit Statistics
              </h2>
              <VisitStats />
            </div>
            <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-emerald-100">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                Support & Suggestions
              </h2>
              <SupportRequestsPanel />
            </div>
          </section>
        </div>

        <footer className="mt-4 flex items-center justify-between border-t border-orange-100 pt-4 text-xs text-slate-500">
          <span>Why All These Assignments · Computer Science</span>
          <a
            href="/"
            className="text-orange-600 hover:text-orange-700 hover:underline"
          >
            ← Back to Student View
          </a>
        </footer>
      </div>
    </div>
  );
}

