import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { getOpenAIChatModel, setOpenAIChatModel } from "@/lib/ai-model";

const ALLOWED_MODELS = ["gpt-4o", "gpt-5"];

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const model = await getOpenAIChatModel();
    return NextResponse.json({ model });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to get AI model" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const model = typeof body.model === "string" ? body.model.trim() : "";
    if (!ALLOWED_MODELS.includes(model)) {
      return NextResponse.json(
        { error: `Model must be one of: ${ALLOWED_MODELS.join(", ")}` },
        { status: 400 }
      );
    }
    const result = await setOpenAIChatModel(model);
    if (!result.ok) {
      const message =
        result.error?.includes("relation") || result.error?.includes("does not exist")
          ? "app_settings table missing. Run migration 004_app_settings.sql in Supabase."
          : result.error || "Failed to save model";
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ model });
  } catch (err) {
    console.error("PATCH /api/admin/ai-model:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
