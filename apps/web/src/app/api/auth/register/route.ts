import { ApiRequestError, authenticate } from "@/lib/api";
import { setSession } from "@/lib/session";

// BFF: proxy register to the Express API. Registration returns a token too, so
// the new account is logged in immediately (cookie set here).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  try {
    const { token } = await authenticate("register", body);
    await setSession(token);
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Registration failed";
    return Response.json({ error: message }, { status });
  }
}
