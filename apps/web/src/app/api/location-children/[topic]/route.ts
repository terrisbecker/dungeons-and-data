import { ApiRequestError, serverFetch } from "@/lib/api";

// Allowlisted proxy to a location's owned-child endpoints (POST) — currently
// just building inventory. The list is hardcoded so this can never be used to
// reach an arbitrary API path; the API's own guards resolve each child up to
// its location and enforce ownership.
const ALLOWED_TOPICS = new Set(["inventory-items"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ topic: string }> },
) {
  const { topic } = await params;
  if (!ALLOWED_TOPICS.has(topic)) {
    return Response.json({ error: "Unknown topic" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const created = await serverFetch<{ id: string }>(`/${topic}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return Response.json(created, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not add entry";
    return Response.json({ error: message }, { status });
  }
}
