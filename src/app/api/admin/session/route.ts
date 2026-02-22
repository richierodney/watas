import { NextRequest, NextResponse } from "next/server";
import { createAdminCookieValue, getAdminCookieName, getAdminCookieMaxAge } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const value = createAdminCookieValue();
  if (!value) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getAdminCookieName(), value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: getAdminCookieMaxAge(),
    path: "/",
  });
  return res;
}
