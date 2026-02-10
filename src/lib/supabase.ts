import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create a dummy client if env vars are missing (for build time)
// This prevents build errors, but the app won't work until env vars are set
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client that will fail gracefully
    return createClient(
      "https://placeholder.supabase.co",
      "placeholder-key",
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();

// Database Types
export type GroupId = "Group 1" | "Group 2";

export type Course = {
  id: string;
  code: string;
  name: string;
  created_at?: string;
  updated_at?: string;
};

export type Group = {
  id: GroupId;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Assignment = {
  id: string;
  title: string;
  course_code: string;
  course_name: string;
  groups: GroupId[];
  due_date: string; // ISO date string
  description?: string;
  created_at?: string;
  updated_at?: string;
};

export type PageVisit = {
  id: string;
  page_path: string;
  user_agent?: string;
  referrer?: string;
  ip_address?: string;
  visited_at: string;
};

