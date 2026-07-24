// Cookie config with NO `next/headers` import, so it is safe to use from the
// proxy (edge) runtime as well as server components/route handlers.

export const SESSION_COOKIE = "session";

// Matches the API's JWT_EXPIRES_IN default (7d).
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
