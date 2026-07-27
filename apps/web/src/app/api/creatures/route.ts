import { ApiRequestError, createCreature, listCreatures } from "@/lib/api";

// BFF proxy for the creature list and create. GET feeds the client-side
// creature pickers (placing a creature at a location); it forwards only the
// query params the API understands. POST is forwarded as-is — the API's
// `guardCreatureCreate` decides whether the caller may write the target scope.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const campaignId = params.get("campaignId");
  if (!campaignId) {
    return Response.json({ error: "campaignId is required" }, { status: 400 });
  }
  const kind = params.get("kind");

  try {
    const rows = await listCreatures(campaignId, {
      includeShared: params.get("includeShared") === "true",
      kind: kind === "NPC" || kind === "MONSTER" ? kind : undefined,
    });
    return Response.json(rows);
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not load creatures";
    return Response.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const created = await createCreature(body);
    return Response.json(created, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not create creature";
    return Response.json({ error: message }, { status });
  }
}
