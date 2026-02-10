import { supabase, type Course, type Group, type Assignment, type GroupId } from "./supabase";

// Re-export types for convenience
export type { Course, Group, Assignment, GroupId } from "./supabase";

// Helper to check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

// Courses
export async function getCourses(): Promise<Course[]> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured. Returning empty array.");
    return [];
  }
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("code", { ascending: true });

  if (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
  return data || [];
}

export async function createCourse(code: string, name: string): Promise<Course | null> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured. Cannot create course.");
    return null;
  }
  const { data, error } = await supabase
    .from("courses")
    .insert({ code, name })
    .select()
    .single();

  if (error) {
    console.error("Error creating course:", error);
    return null;
  }
  return data;
}

export async function updateCourse(id: string, code: string, name: string): Promise<Course | null> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured. Cannot update course.");
    return null;
  }
  const { data, error } = await supabase
    .from("courses")
    .update({ code, name })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating course:", error);
    return null;
  }
  return data;
}

export async function deleteCourse(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured. Cannot delete course.");
    return false;
  }
  const { error } = await supabase.from("courses").delete().eq("id", id);

  if (error) {
    console.error("Error deleting course:", error);
    return false;
  }
  return true;
}

// Groups
export async function getGroups(): Promise<Group[]> {
  if (!isSupabaseConfigured()) {
    return [
      { id: "Group 1" as GroupId, enabled: true },
      { id: "Group 2" as GroupId, enabled: true },
    ];
  }
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching groups:", error);
    return [
      { id: "Group 1" as GroupId, enabled: true },
      { id: "Group 2" as GroupId, enabled: true },
    ];
  }
  return data || [];
}

export async function updateGroup(id: GroupId, enabled: boolean): Promise<Group | null> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured. Cannot update group.");
    return null;
  }
  const { data, error } = await supabase
    .from("groups")
    .update({ enabled })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating group:", error);
    return null;
  }
  return data;
}

// Assignments
export async function getAssignments(): Promise<Assignment[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching assignments:", error);
    return [];
  }
  return data || [];
}

export async function createAssignment(
  title: string,
  courseCode: string,
  courseName: string,
  groups: GroupId[],
  dueDate: string,
  description?: string,
): Promise<Assignment | null> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured. Cannot create assignment.");
    return null;
  }
  const { data, error } = await supabase
    .from("assignments")
    .insert({
      title,
      course_code: courseCode,
      course_name: courseName,
      groups,
      due_date: dueDate,
      description: description || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating assignment:", error);
    return null;
  }
  return data;
}

export async function deleteAssignment(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured. Cannot delete assignment.");
    return false;
  }
  const { error } = await supabase.from("assignments").delete().eq("id", id);

  if (error) {
    console.error("Error deleting assignment:", error);
    return false;
  }
  return true;
}

// Page Visits / Analytics
export async function trackPageVisit(
  pagePath: string,
  userAgent?: string,
  referrer?: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // Silently fail during build/prerender
    return false;
  }
  const { error } = await supabase.from("page_visits").insert({
    page_path: pagePath,
    user_agent: userAgent || null,
    referrer: referrer || null,
  });

  if (error) {
    console.error("Error tracking page visit:", error);
    return false;
  }
  return true;
}

export type VisitStats = {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byPage: Array<{ page: string; count: number }>;
  recent: Array<{
    page: string;
    visited_at: string;
    user_agent?: string;
  }>;
};

export async function getVisitStats(): Promise<VisitStats | null> {
  if (!isSupabaseConfigured()) {
    return {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      byPage: [],
      recent: [],
    };
  }
  const now = new Date();
  const today = new Date(now.setHours(0, 0, 0, 0));
  const thisWeek = new Date(today);
  thisWeek.setDate(today.getDate() - 7);
  const thisMonth = new Date(today);
  thisMonth.setMonth(today.getMonth() - 1);

  // Get total count
  const { count: total, error: totalError } = await supabase
    .from("page_visits")
    .select("*", { count: "exact", head: true });

  // Get today's count
  const { count: todayCount, error: todayError } = await supabase
    .from("page_visits")
    .select("*", { count: "exact", head: true })
    .gte("visited_at", today.toISOString());

  // Get this week's count
  const { count: weekCount, error: weekError } = await supabase
    .from("page_visits")
    .select("*", { count: "exact", head: true })
    .gte("visited_at", thisWeek.toISOString());

  // Get this month's count
  const { count: monthCount, error: monthError } = await supabase
    .from("page_visits")
    .select("*", { count: "exact", head: true })
    .gte("visited_at", thisMonth.toISOString());

  // Get visits by page
  const { data: byPageData, error: byPageError } = await supabase
    .from("page_visits")
    .select("page_path")
    .order("visited_at", { ascending: false });

  // Get recent visits
  const { data: recentData, error: recentError } = await supabase
    .from("page_visits")
    .select("page_path, visited_at, user_agent")
    .order("visited_at", { ascending: false })
    .limit(10);

  if (
    totalError ||
    todayError ||
    weekError ||
    monthError ||
    byPageError ||
    recentError
  ) {
    console.error("Error fetching visit stats:", {
      totalError,
      todayError,
      weekError,
      monthError,
      byPageError,
      recentError,
    });
    return null;
  }

  // Count by page
  const pageCounts = new Map<string, number>();
  byPageData?.forEach((visit) => {
    const count = pageCounts.get(visit.page_path) || 0;
    pageCounts.set(visit.page_path, count + 1);
  });

  const byPage = Array.from(pageCounts.entries())
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total: total || 0,
    today: todayCount || 0,
    thisWeek: weekCount || 0,
    thisMonth: monthCount || 0,
    byPage,
    recent: (recentData || []).map((v) => ({
      page: v.page_path,
      visited_at: v.visited_at,
      user_agent: v.user_agent || undefined,
    })),
  };
}

