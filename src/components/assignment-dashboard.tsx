"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAssignments,
  getGroups,
  getCompletedAssignmentIds,
  setAssignmentCompleted,
  type Assignment,
  type GroupId,
  type Group,
} from "@/lib/db-helpers";
import { usePageVisit } from "@/hooks/use-page-visit";
import { MarkdownRenderer } from "./markdown-renderer";
import { SupportRequestForm } from "./support-request-form";
import { useAuth } from "./auth-provider";
import { DashboardHeader } from "./dashboard-header";
import { GenerateSolutionDialog } from "./generate-solution-dialog";

type FilterState = {
  group: GroupId | "All";
  courseCode: string | "All";
};

type LocalAssignment = {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  groups: GroupId[];
  dueDate: string;
  description?: string;
};

type EnrichedAssignment = LocalAssignment & {
  due: Date;
  daysRemaining: number;
};

function enrichAssignments(data: LocalAssignment[]): EnrichedAssignment[] {
  const today = new Date();

  return data
    .map((a) => {
      const due = new Date(a.dueDate);
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.ceil(
        (due.getTime() - today.getTime()) / msPerDay,
      );
      return { ...a, due, daysRemaining };
    })
    .sort((a, b) => a.due.getTime() - b.due.getTime());
}

function formatDaysRemaining(daysRemaining: number): string {
  if (daysRemaining > 1) {
    return `${daysRemaining} days remaining`;
  }
  if (daysRemaining === 1) {
    return "Due tomorrow";
  }
  if (daysRemaining === 0) {
    return "Due today";
  }
  if (daysRemaining === -1) {
    return "1 day past due";
  }
  return `${Math.abs(daysRemaining)} days past due`;
}

type AssignmentDashboardProps = {
  initialAssignments?: Assignment[];
  initialGroups?: Group[];
};

export function AssignmentDashboard({
  initialAssignments = [],
  initialGroups = [],
}: AssignmentDashboardProps) {
  const hasInitial = initialAssignments.length > 0 || initialGroups.length > 0;
  const [filters, setFilters] = useState<FilterState>({
    group: "All",
    courseCode: "All",
  });
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});
  const [assignmentsData, setAssignmentsData] = useState<Assignment[]>(initialAssignments);
  const [groupsData, setGroupsData] = useState<Array<{ id: GroupId; enabled: boolean }>>(
    initialGroups.length > 0 ? initialGroups : []
  );
  const [loading, setLoading] = useState(!hasInitial);
  const [solutionDialogAssignment, setSolutionDialogAssignment] = useState<EnrichedAssignment | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [completionToggling, setCompletionToggling] = useState<Set<string>>(new Set());
  const { user, profile } = useAuth();

  usePageVisit("/");
  
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!user) {
      setCompletedIds(new Set());
      return;
    }
    getCompletedAssignmentIds().then((ids) => setCompletedIds(new Set(ids)));
  }, [user?.id]);

  const loadData = async () => {
    if (!hasInitial) setLoading(true);
    const [assignments, groups] = await Promise.all([
      getAssignments(),
      getGroups(),
    ]);
    setAssignmentsData(assignments);
    setGroupsData(groups);
    setLoading(false);
  };

  const handleCompletionToggle = async (assignmentId: string, currentlyCompleted: boolean) => {
    setCompletionToggling((prev) => new Set(prev).add(assignmentId));
    const ok = await setAssignmentCompleted(assignmentId, !currentlyCompleted);
    setCompletionToggling((prev) => {
      const next = new Set(prev);
      next.delete(assignmentId);
      return next;
    });
    if (ok) {
      setCompletedIds((prev) => {
        const next = new Set(prev);
        if (currentlyCompleted) next.delete(assignmentId);
        else next.add(assignmentId);
        return next;
      });
    }
  };

  // Transform database assignments to component format
  const assignments = useMemo(() => {
    return enrichAssignments(
      assignmentsData.map((a) => ({
        id: a.id,
        title: a.title,
        courseCode: a.course_code,
        courseName: a.course_name,
        groups: a.groups,
        dueDate: a.due_date,
        description: a.description,
      })),
    );
  }, [assignmentsData]);

  const enabledGroups = useMemo(() => {
    return groupsData.filter((g) => g.enabled).map((g) => g.id);
  }, [groupsData]);

  const courseOptions = useMemo(
    () =>
      Array.from(
        new Set(assignments.map((a) => `${a.courseCode} – ${a.courseName}`)),
      ).map((label) => {
        const [courseCode] = label.split(" – ");
        return { value: courseCode, label };
      }),
    [assignments],
  );

  const filteredAssignments = assignments.filter((assignment) => {
    // Only show assignments for enabled groups
    const hasEnabledGroup = assignment.groups.some((g) =>
      enabledGroups.includes(g),
    );
    if (!hasEnabledGroup) return false;

    const matchesGroup =
      filters.group === "All" || assignment.groups.includes(filters.group);
    const matchesCourse =
      filters.courseCode === "All" ||
      assignment.courseCode === filters.courseCode;
    return matchesGroup && matchesCourse;
  });

  const upcomingAssignments = filteredAssignments.filter(
    (assignment) => assignment.daysRemaining >= 0,
  );
  const pastDueAssignments = filteredAssignments.filter(
    (assignment) => assignment.daysRemaining < 0,
  );

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-8 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <DashboardHeader />
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-700/70">
            Why All These Assignments   · Developed by <a href="https://kuwrodney.carrd.co/" target="_blank" rel="noopener noreferrer"><em><b><u>Kuwguap</u></b></em></a>
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            WATAs — Assignment Tracker
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Stay on top of upcoming work. Assignments are sorted by{" "}
            <span className="font-semibold text-emerald-700">
              closest due date
            </span>{" "}
            with quick filters for group and course.
          </p>
        </header>

        <section className="flex flex-col gap-4 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-orange-100 backdrop-blur-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Group
              </span>
              <div className="inline-flex rounded-full bg-orange-50 p-1">
                {(["All", ...enabledGroups] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, group: value }))
                    }
                    className={[
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      filters.group === value
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-orange-800 hover:bg-orange-100",
                    ].join(" ")}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1 text-sm sm:text-xs">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Course
              </span>
              <select
                className="w-full rounded-full border border-orange-100 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm outline-none ring-0 focus:border-orange-300 focus:ring-2 focus:ring-orange-200 sm:text-sm"
                value={filters.courseCode}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    courseCode: e.target.value as FilterState["courseCode"],
                  }))
                }
              >
                <option value="All">All courses</option>
                {courseOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing{" "}
              <span className="font-semibold text-emerald-700">
                {filteredAssignments.length}
              </span>{" "}
              assignment
              {filteredAssignments.length === 1 ? "" : "s"}
            </span>
            <span className="hidden sm:inline">
              Automatically sorted by due date (earliest first)
            </span>
          </div>
        </section>

        <main className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <div className="col-span-full py-8 text-center text-sm text-slate-500">
              Loading assignments...
            </div>
          ) : (
            <>
              {upcomingAssignments.map((assignment) => {
                const isPastDue = assignment.daysRemaining < 0;
                const isLong =
                  (assignment.description?.length ?? 0) > 280;
                const isExpanded =
                  expandedDescriptions[assignment.id] ?? false;

                return (
                  <article
                    key={assignment.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 transition-transform hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-semibold text-slate-900">
                          {assignment.title}
                        </h2>
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-medium",
                            isPastDue
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-800",
                          ].join(" ")}
                        >
                          {formatDaysRemaining(assignment.daysRemaining)}
                        </span>
                      </div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        {assignment.courseCode} · {assignment.courseName}
                      </p>
                      {assignment.description ? (
                        <div className="text-sm text-slate-600">
                          <div
                            className={
                              isLong && !isExpanded
                                ? "max-h-24 overflow-hidden relative"
                                : ""
                            }
                          >
                            {isLong && !isExpanded && (
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
                            )}
                            <MarkdownRenderer
                              content={assignment.description}
                            />
                          </div>
                          {isLong && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedDescriptions((prev) => ({
                                  ...prev,
                                  [assignment.id]: !isExpanded,
                                }))
                              }
                              className="mt-1 text-xs font-medium text-orange-700 hover:text-orange-800 hover:underline"
                            >
                              {isExpanded ? "View less" : "View more"}
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {user && (
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={completedIds.has(assignment.id)}
                              disabled={completionToggling.has(assignment.id)}
                              onChange={() => handleCompletionToggle(assignment.id, completedIds.has(assignment.id))}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>{completedIds.has(assignment.id) ? "Done" : "Mark done"}</span>
                          </label>
                        )}
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 font-medium",
                            isPastDue
                              ? "bg-red-50 text-red-700"
                              : "bg-orange-50 text-orange-800",
                          ].join(" ")}
                        >
                          Due{" "}
                          {assignment.due.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-600">
                          Groups:
                          {assignment.groups.map((group) => (
                            <span key={group} className="text-slate-900">
                              {group}
                            </span>
                          ))}
                        </span>
                        {profile?.is_pro && (
                          <button
                            type="button"
                            onClick={() => setSolutionDialogAssignment(assignment)}
                            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                          >
                            Generate Solution
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}

              {upcomingAssignments.length === 0 && !loading && (
                <div className="col-span-full rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 px-4 py-8 text-center text-sm text-orange-800">
                  No upcoming assignments match these filters yet. Try
                  switching groups or showing all courses.
                </div>
              )}
            </>
          )}
        </main>

        {solutionDialogAssignment && (
          <GenerateSolutionDialog
            assignment={{
              title: solutionDialogAssignment.title,
              courseCode: solutionDialogAssignment.courseCode,
              courseName: solutionDialogAssignment.courseName,
              description: solutionDialogAssignment.description,
            }}
            open={!!solutionDialogAssignment}
            onClose={() => setSolutionDialogAssignment(null)}
          />
        )}

        {pastDueAssignments.length > 0 && (
          <section className="mt-4 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
                Past Due
              </h2>
              <span className="text-xs text-red-600">
                {pastDueAssignments.length} assignment
                {pastDueAssignments.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {pastDueAssignments.map((assignment) => {
                const isLong =
                  (assignment.description?.length ?? 0) > 280;
                const isExpanded =
                  expandedDescriptions[assignment.id] ?? false;

                return (
                  <article
                    key={assignment.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-red-100"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {assignment.title}
                        </h3>
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[0.7rem] font-medium text-red-700">
                          {formatDaysRemaining(assignment.daysRemaining)}
                        </span>
                      </div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        {assignment.courseCode} · {assignment.courseName}
                      </p>
                      {assignment.description ? (
                        <div className="text-xs text-slate-600">
                          <div
                            className={
                              isLong && !isExpanded
                                ? "max-h-20 overflow-hidden relative"
                                : ""
                            }
                          >
                            {isLong && !isExpanded && (
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
                            )}
                            <MarkdownRenderer
                              content={assignment.description}
                            />
                          </div>
                          {isLong && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedDescriptions((prev) => ({
                                  ...prev,
                                  [assignment.id]: !isExpanded,
                                }))
                              }
                              className="mt-1 text-[0.7rem] font-medium text-red-700 hover:text-red-800 hover:underline"
                            >
                              {isExpanded ? "View less" : "View more"}
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {user && (
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={completedIds.has(assignment.id)}
                            disabled={completionToggling.has(assignment.id)}
                            onChange={() => handleCompletionToggle(assignment.id, completedIds.has(assignment.id))}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{completedIds.has(assignment.id) ? "Done" : "Mark done"}</span>
                        </label>
                      )}
                      {profile?.is_pro && (
                        <button
                          type="button"
                          onClick={() => setSolutionDialogAssignment(assignment)}
                          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                        >
                          Generate Solution
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <SupportRequestForm />

        <footer className="mt-4 flex flex-col gap-2 border-t border-orange-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Why All These Assignments · Computer Science</span>
          <div className="flex flex-wrap items-center gap-4">
            <span className="hidden sm:inline">
              WATAss · Developed by{" "}
              <a
                href="https://kuwrodney.carrd.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-orange-600 hover:underline"
              >
                Kuwguap
              </a>
            </span>
            <a
              href="/admin"
              className="text-orange-600 hover:text-orange-700 hover:underline"
            >
              Admin →
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AssignmentDashboard;


