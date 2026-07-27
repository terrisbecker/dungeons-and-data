import { ApiRequestError, serverFetch } from "@/lib/api";

// BFF proxy for placing a creature at a location (POST /creature-placements).
// The API authorizes BOTH ends — the creature and the location — so a DM can't
// drop a shared monster into another campaign's world.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const created = await serverFetch("/creature-placements", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return Response.json(created, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not place creature";
    return Response.json({ error: message }, { status });
  }
}
