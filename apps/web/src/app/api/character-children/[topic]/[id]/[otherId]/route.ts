import { ApiRequestError, serverFetch } from "@/lib/api";

// BFF proxy for deleting the composite-key catalog joins
// (`/{topic}/{characterId}/{catalogId}`). The `[id]` segment is the characterId,
// `[otherId]` the spell/feat/feature id. (The single-segment `[id]` DELETE route
// handles single-id children — this sits a level deeper, so the shared `[id]`
// slug name avoids Next's "different slug names at the same position" error.)
const ALLOWED_TOPICS = new Set([
  "character-spells",
  "character-feats",
  "character-features",
]);

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ topic: string; id: string; otherId: string }> },
) {
  const { topic, id, otherId } = await params;
  if (!ALLOWED_TOPICS.has(topic)) {
    return Response.json({ error: "Unknown resource" }, { status: 404 });
  }

  try {
    await serverFetch<void>(
      `/${topic}/${encodeURIComponent(id)}/${encodeURIComponent(otherId)}`,
      { method: "DELETE" },
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not remove entry";
    return Response.json({ error: message }, { status });
  }
}
