import { ApiRequestError, serverFetch } from "@/lib/api";

// A placement is keyed on (creatureId, locationId) rather than an id, so both
// halves of the key are route segments. Only quantity/notes are editable — the
// key pair itself is immutable API-side.
type Params = { params: Promise<{ creatureId: string; locationId: string }> };

function pathOf(creatureId: string, locationId: string): string {
  return `/creature-placements/${encodeURIComponent(creatureId)}/${encodeURIComponent(locationId)}`;
}

export async function PATCH(request: Request, { params }: Params) {
  const { creatureId, locationId } = await params;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const updated = await serverFetch(pathOf(creatureId, locationId), {
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

export async function DELETE(_request: Request, { params }: Params) {
  const { creatureId, locationId } = await params;

  try {
    await serverFetch<void>(pathOf(creatureId, locationId), {
      method: "DELETE",
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not remove placement";
    return Response.json({ error: message }, { status });
  }
}
