import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function getUserIdAndEmail(req: NextRequest): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key);
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user?.id || !user?.email) return null;
  return { id: user.id, email: user.email };
}

export async function POST(req: NextRequest) {
  const user = await getUserIdAndEmail(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  const amount = process.env.PAYSTACK_PRO_AMOUNT;
  if (!secret || !amount) {
    return NextResponse.json(
      { error: "Paystack is not configured" },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const baseUrl =
    body.callbackBaseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Callback URL not configured. Set NEXT_PUBLIC_APP_URL or pass callbackBaseUrl." },
      { status: 400 }
    );
  }

  const reference = `pro_${user.id.replace(/-/g, "")}_${Date.now()}`;
  const callbackUrl = `${baseUrl.replace(/\/$/, "")}/pro?reference=${reference}`;

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: String(amount),
      reference,
      callback_url: callbackUrl,
      metadata: {
        user_id: user.id,
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.status) {
    console.error("Paystack initialize error", data);
    return NextResponse.json(
      { error: data.message || "Failed to initialize payment" },
      { status: 502 }
    );
  }

  const authorizationUrl = data.data?.authorization_url;
  if (!authorizationUrl) {
    return NextResponse.json(
      { error: "Invalid response from Paystack" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    authorization_url: authorizationUrl,
    reference: data.data?.reference,
  });
}
