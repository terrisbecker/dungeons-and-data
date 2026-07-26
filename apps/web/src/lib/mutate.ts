"use client";

import { toast } from "sonner";

// The one client-side write helper. Every browser mutation goes through the BFF
// (`/api/…`), which attaches the JWT from the httpOnly cookie — the token never
// reaches the browser. This owns its error toast and returns a boolean, so
// callers only ever handle the success path.
export async function send(
  url: string,
  method: string,
  body?: unknown,
  fallback = "Something went wrong",
): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method,
      headers:
        body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const parsed = await res.json().catch(() => null);
      toast.error(parsed?.error ?? fallback);
      return false;
    }
    return true;
  } catch {
    toast.error("Could not reach the server");
    return false;
  }
}
