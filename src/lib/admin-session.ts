import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_COOKIE = "watas_admin";
const MAX_AGE_SEC = 60 * 60 * 8; // 8 hours

function sign(expiry: number): string {
  const secret = process.env.ADMIN_PASSWORD || "secret";
  return createHmac("sha256", secret).update(String(expiry)).digest("hex");
}

export async function getAdminSession(): Promise<boolean> {
  const c = await cookies();
  const raw = c.get(ADMIN_COOKIE)?.value;
  if (!raw) return false;
  const [expiryStr, sig] = raw.split(".");
  if (!expiryStr || !sig) return false;
  const expiry = parseInt(expiryStr, 10);
  if (Date.now() > expiry) return false;
  const expected = sign(expiry);
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  return true;
}

export function createAdminCookieValue(): string | null {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return null;
  const expiry = Date.now() + MAX_AGE_SEC * 1000;
  const sig = sign(expiry);
  return `${expiry}.${sig}`;
}

export function getAdminCookieName() {
  return ADMIN_COOKIE;
}

export function getAdminCookieMaxAge() {
  return MAX_AGE_SEC;
}
