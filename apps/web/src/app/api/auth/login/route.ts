import { ApiRequestError, authenticate } from "@/lib/api";
import { setSession } from "@/lib/session";

// BFF: proxy login to the Express API, then store the returned JWT in an
// httpOnly cookie. The token is never sent back to the browser.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  try {
    const { token } = await authenticate("login", body);
    await setSession(token);
    return Response.json({ ok: true });
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Login failed";
    return Response.json({ error: message }, { status });
  }
}
