"use client";

import { useEffect, useState } from "react";
import {
  getAssignments,
  createAssignment,
  deleteAssignment,
  getCourses,
  type Assignment,
  type GroupId,
} from "@/lib/db-helpers";
import { MarkdownEditor } from "./markdown-editor";
import { MarkdownRenderer } from "./markdown-renderer";

export function AssignmentCreator() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Array<{ code: string; name: string }>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<GroupId[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [assignmentsData, coursesData] = await Promise.all([
      getAssignments(),
      getCourses(),
    ]);
    setAssignments(assignmentsData);
    setCourses(
      coursesData.map((c) => ({
        code: c.code,
        name: c.name,
      })),
    );
    setLoading(false);
  };

  const handleGroupToggle = (group: GroupId) => {
    setSelectedGroups((prev) =>
      prev.includes(group)
        ? prev.filter((g) => g !== group)
        : [...prev, group],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !title.trim() ||
      !courseCode.trim() ||
      selectedGroups.length === 0 ||
      !dueDate
    ) {
      alert(
        "Please fill in all required fields (title, course, groups, due date)",
      );
      return;
    }

    const newAssignment = await createAssignment(
      title.trim(),
      courseCode.trim(),
      courseName.trim() || courseCode.trim(),
      selectedGroups,
      dueDate,
      description.trim() || undefined,
    );

    if (newAssignment) {
      await loadData();
      // Reset form
      setTitle("");
      setCourseCode("");
      setCourseName("");
      setSelectedGroups([]);
      setDueDate("");
      setDescription("");
    } else {
      alert(
        "Failed to create assignment. Please check your Supabase connection.",
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    const success = await deleteAssignment(id);
    if (success) {
      await loadData();
    } else {
      alert(
        "Failed to delete assignment. Please check your Supabase connection.",
      );
    }
  };

  const handleCourseSelect = (code: string) => {
    const course = courses.find((c) => c.code === code);
    if (course) {
      setCourseCode(course.code);
      setCourseName(course.name);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.1em] text-slate-700">
              Assignment Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Search & Heuristics Worksheet"
              className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.1em] text-slate-700">
              Course *
            </label>
            <select
              value={courseCode}
              onChange={(e) => handleCourseSelect(e.target.value)}
              className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              required
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.code} value={course.code}>
                  {course.code} – {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.1em] text-slate-700">
              Due Date *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.1em] text-slate-700">
              Groups *
            </label>
            <div className="flex gap-2">
              {(["Group 1", "Group 2"] as GroupId[]).map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => handleGroupToggle(group)}
                  className={[
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    selectedGroups.includes(group)
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-orange-200 bg-white text-slate-700 hover:bg-orange-50",
                  ].join(" ")}
                >
                  {group}
                </button>
              ))}
            </div>
            {selectedGroups.length === 0 && (
              <p className="mt-1 text-xs text-red-600">
                Select at least one group
              </p>
            )}
          </div>
        </div>

        <div>
          <MarkdownEditor
            value={description}
            onChange={setDescription}
            placeholder="Add assignment details or instructions... Use Markdown for formatting: **bold**, *italic*, lists, etc."
            label="Description (Optional)"
            rows={6}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200 sm:w-auto"
        >
          Create Assignment
        </button>
      </form>

      <div className="mt-4 border-t border-orange-100 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Existing Assignments ({assignments.length})
        </h3>
        <div className="flex flex-col gap-2">
          {loading ? (
            <p className="py-4 text-center text-sm text-slate-500">Loading...</p>
          ) : assignments.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">
              No assignments yet. Create one above.
            </p>
          ) : (
            assignments
              .sort((a, b) => a.due_date.localeCompare(b.due_date))
              .map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-start justify-between rounded-lg border border-orange-100 bg-white/60 px-3 py-2"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {assignment.title}
                    </p>
                    <p className="text-xs text-slate-600">
                      {assignment.course_code} · Due:{" "}
                      {new Date(assignment.due_date).toLocaleDateString()} ·{" "}
                      {assignment.groups.join(", ")}
                    </p>
                    {assignment.description && (
                      <div className="mt-1 text-xs text-slate-500">
                        <MarkdownRenderer content={assignment.description} />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(assignment.id)}
                    className="ml-2 text-xs text-red-600 hover:text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

