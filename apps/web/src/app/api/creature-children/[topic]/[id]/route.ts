import { ApiRequestError, serverFetch } from "@/lib/api";

// PATCH/DELETE one creature child row by its own id. Same allowlist as the POST
// route beside it — declared per-file so neither can drift open.
const ALLOWED_TOPICS = new Set([
  "creature-skills",
  "stat-block-entries",
  "creature-damage-modifiers",
  "inventory-items",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ topic: string; id: string }> },
) {
  const { topic, id } = await params;
  if (!ALLOWED_TOPICS.has(topic)) {
    return Response.json({ error: "Unknown topic" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const updated = await serverFetch(`/${topic}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return Response.json(updated);
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not save changes";
    return Response.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ topic: string; id: string }> },
) {
  const { topic, id } = await params;
  if (!ALLOWED_TOPICS.has(topic)) {
    return Response.json({ error: "Unknown topic" }, { status: 404 });
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
