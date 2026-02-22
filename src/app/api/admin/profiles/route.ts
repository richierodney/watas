import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createAdminClient();
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, index_number, reference, is_pro, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error(profilesError);
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
    }

    const { data: listData } = await supabase.auth.admin.listUsers();
    const userList = listData?.users ?? [];
    const emailById = new Map(userList.map((u) => [u.id, u.email]));

    const list = (profiles ?? []).map((p) => ({
      ...p,
      email: emailById.get(p.id) ?? null,
    }));

    return NextResponse.json({ profiles: list });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
