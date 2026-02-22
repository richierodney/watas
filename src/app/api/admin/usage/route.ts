import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createAdminClient();
    const { data: rows, error } = await supabase
      .from("api_usage")
      .select("user_id, endpoint, input_tokens, output_tokens, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
    }

    const byUser = new Map<
      string,
      { totalRequests: number; inputTokens: number; outputTokens: number }
    >();
    let totalRequests = 0;
    let totalInput = 0;
    let totalOutput = 0;

    for (const r of rows ?? []) {
      totalRequests += 1;
      totalInput += r.input_tokens ?? 0;
      totalOutput += r.output_tokens ?? 0;
      const cur = byUser.get(r.user_id) ?? {
        totalRequests: 0,
        inputTokens: 0,
        outputTokens: 0,
      };
      cur.totalRequests += 1;
      cur.inputTokens += r.input_tokens ?? 0;
      cur.outputTokens += r.output_tokens ?? 0;
      byUser.set(r.user_id, cur);
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(byUser.keys()));

    const perUser = Array.from(byUser.entries()).map(([userId, stats]) => {
      const profile = profiles?.find((p) => p.id === userId);
      return {
        user_id: userId,
        full_name: profile?.full_name ?? "—",
        ...stats,
      };
    });

    return NextResponse.json({
      overall: { totalRequests, totalInputTokens: totalInput, totalOutputTokens: totalOutput },
      perUser,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
