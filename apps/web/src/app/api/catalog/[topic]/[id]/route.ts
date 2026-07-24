import { ApiRequestError, serverFetch } from "@/lib/api";

// BFF proxy for editing/removing a catalog row. Both verbs forward to the API,
// whose `guardCatalog` enforces Admin-or-DM.
const ALLOWED_TOPICS = new Set(["items", "spells", "feats", "features"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ topic: string; id: string }> },
) {
  const { topic, id } = await params;
  if (!ALLOWED_TOPICS.has(topic)) {
    return Response.json({ error: "Unknown catalog" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const updated = await serverFetch<{ id: string }>(
      `/${topic}/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
    return Response.json(updated);
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not update entry";
    return Response.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ topic: string; id: string }> },
) {
  const { topic, id } = await params;
  if (!ALLOWED_TOPICS.has(topic)) {
    return Response.json({ error: "Unknown catalog" }, { status: 404 });
  }

  try {
    await serverFetch<void>(`/${topic}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not remove entry";
    return Response.json({ error: message }, { status });
  }
}
