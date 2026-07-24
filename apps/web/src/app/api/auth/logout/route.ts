import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/session-config";

// POST: used by the logout button (fetch, then client-side redirect).
export async function POST() {
  await clearSession();
  return Response.json({ ok: true });
}

// GET: the escape hatch when a stored token is invalid/expired — clears the
// cookie and redirects to /login (a plain redirect would otherwise loop, since
// the proxy sees a cookie and bounces back to the dashboard).
export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL("/login", request.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
