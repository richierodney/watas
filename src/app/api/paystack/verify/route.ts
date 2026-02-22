import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json(
      { error: "Missing reference" },
      { status: 400 }
    );
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Paystack is not configured" },
      { status: 503 }
    );
  }

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secret}` },
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.status) {
    return NextResponse.json(
      { error: data.message || "Verification failed" },
      { status: 400 }
    );
  }

  const tx = data.data;
  if (tx?.status !== "success") {
    return NextResponse.json(
      { error: "Payment was not successful" },
      { status: 400 }
    );
  }

  let meta = tx.metadata;
  if (typeof meta === "string" && meta) {
    try {
      meta = JSON.parse(meta) as Record<string, unknown>;
    } catch {
      meta = {};
    }
  }
  const userId = (meta && typeof meta === "object" && (meta as Record<string, unknown>).user_id) as string | undefined;
  if (!userId) {
    return NextResponse.json(
      { error: "Invalid transaction metadata" },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .update({ is_pro: true })
      .eq("id", userId);

    if (error) {
      console.error("Failed to set is_pro:", error);
      return NextResponse.json(
        { error: "Failed to activate PRO" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
