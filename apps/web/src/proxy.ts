import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-config";

// Next 16's request interceptor (the renamed `middleware`). Gates routes by the
// presence of the session cookie — cheap and edge-safe (no token verification
// here; the API is the real authority when a request actually reaches it).

const AUTH_PAGES = ["/login", "/register"];
const PROTECTED_PREFIXES = ["/dashboard", "/campaigns"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (AUTH_PAGES.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
