import { ApiRequestError, serverFetch } from "@/lib/api";

// BFF proxy for deleting a character's owned-child rows. All six topics use a
// single-id DELETE (`/{topic}/{id}`); the API guard verifies ownership.
const ALLOWED_TOPICS = new Set([
  "character-classes",
  "character-skills",
  "spell-slots",
  "character-resources",
  "proficiencies",
  "character-conditions",
]);

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
