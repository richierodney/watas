"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAssignments,
  getGroups,
  type Assignment,
  type GroupId,
} from "@/lib/db-helpers";
import { usePageVisit } from "@/hooks/use-page-visit";
import { MarkdownRenderer } from "./markdown-renderer";

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

export function AssignmentDashboard() {
  const [filters, setFilters] = useState<FilterState>({
    group: "All",
    courseCode: "All",
  });
  const [assignmentsData, setAssignmentsData] = useState<Assignment[]>([]);
  const [groupsData, setGroupsData] = useState<Array<{ id: GroupId; enabled: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  usePageVisit("/");
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [assignments, groups] = await Promise.all([
      getAssignments(),
      getGroups(),
    ]);
    setAssignmentsData(assignments);
    setGroupsData(groups);
    setLoading(false);
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

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-8 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
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
              {filteredAssignments.map((assignment) => (
            <article
              key={assignment.id}
              className="flex flex-col justify-between gap-3 rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-slate-900">
                    {assignment.title}
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-medium text-emerald-800">
                    {formatDaysRemaining(assignment.daysRemaining)}
                  </span>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  {assignment.courseCode} · {assignment.courseName}
                </p>
                {assignment.description ? (
                  <div className="text-sm text-slate-600">
                    <MarkdownRenderer content={assignment.description} />
                  </div>
                ) : null}
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-800">
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
                </div>
              </div>
            </article>
              ))}

              {filteredAssignments.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 px-4 py-8 text-center text-sm text-orange-800">
              No assignments match these filters yet. Try switching groups or
              showing all courses.
            </div>
              )}
            </>
          )}
        </main>

        <footer className="mt-4 flex items-center justify-between border-t border-orange-100 pt-4 text-xs text-slate-500">
          <span>Why All These Assignments · Computer Science</span>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">WATAss · Developed by <a href="https://kuwrodney.carrd.co/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 hover:underline">Kuwguap</a></span>
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


