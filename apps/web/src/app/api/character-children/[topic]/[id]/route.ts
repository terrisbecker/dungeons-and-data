import { ApiRequestError, serverFetch } from "@/lib/api";

// BFF proxy for editing and removing a character's single-id child rows
// (`/{topic}/{id}`): the six owned children plus inventory items. PATCH backs
// the sheet's live tracking (spending a spell slot, ticking a resource down)
// and its inline edits; the body is forwarded as-is because the API validates
// every field per topic. The composite-key catalog joins
// (character-spells/feats/features) delete via the sibling [id]/[otherId] route.
// The API guard verifies ownership on both verbs.
const ALLOWED_TOPICS = new Set([
  "character-classes",
  "character-skills",
  "spell-slots",
  "character-resources",
  "proficiencies",
  "character-conditions",
  "inventory-items",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ topic: string; id: string }> },
) {
  const { topic, id } = await params;
  if (!ALLOWED_TOPICS.has(topic)) {
    return Response.json({ error: "Unknown resource" }, { status: 404 });
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
    return Response.json({ error: "Unknown resource" }, { status: 404 });
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
