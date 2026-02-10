"use client";

import { useEffect, useState } from "react";
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  type Course,
} from "@/lib/db-helpers";

export function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    const data = await getCourses();
    setCourses(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newCode.trim() || !newName.trim()) return;
    const newCourse = await createCourse(newCode.trim(), newName.trim());
    if (newCourse) {
      await loadCourses();
      setNewCode("");
      setNewName("");
    } else {
      alert("Failed to create course. Please check your Supabase connection.");
    }
  };

  const handleEdit = async (id: string, code: string, name: string) => {
    const updated = await updateCourse(id, code, name);
    if (updated) {
      await loadCourses();
      setEditingId(null);
    } else {
      alert("Failed to update course. Please check your Supabase connection.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    const success = await deleteCourse(id);
    if (success) {
      await loadCourses();
    } else {
      alert("Failed to delete course. Please check your Supabase connection.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          placeholder="Course Code (e.g., CSM 157)"
          className="flex-1 rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
        />
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Course Name (e.g., Intro to AI)"
          className="flex-1 rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
        />
        <button
          onClick={handleAdd}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
        >
          Add Course
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {loading ? (
          <p className="py-4 text-center text-sm text-slate-500">Loading...</p>
        ) : courses.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            No courses yet. Add one above.
          </p>
        ) : (
          courses.map((course) =>
            editingId === course.id ? (
              <EditCourseForm
                key={course.id}
                course={course}
                onSave={(code, name) => handleEdit(course.id, code, name)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={course.id}
                className="flex items-center justify-between rounded-lg border border-orange-100 bg-white/60 px-3 py-2"
              >
                <span className="text-sm font-medium text-slate-900">
                  {course.code} · {course.name}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingId(course.id)}
                    className="text-xs text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}

function EditCourseForm({
  course,
  onSave,
  onCancel,
}: {
  course: Course;
  onSave: (code: string, name: string) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(course.code);
  const [name, setName] = useState(course.name);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-orange-200 bg-white p-2 sm:flex-row">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="flex-1 rounded border border-orange-200 px-2 py-1.5 text-sm outline-none focus:border-orange-400"
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded border border-orange-200 px-2 py-1.5 text-sm outline-none focus:border-orange-400"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSave(code, name)}
          className="rounded bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="rounded bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

