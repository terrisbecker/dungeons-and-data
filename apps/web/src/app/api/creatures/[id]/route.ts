import { ApiRequestError, deleteCreature, updateCreature } from "@/lib/api";

// BFF proxy for editing/removing a creature. Both verbs forward to the API,
// whose `guardCreatureByParamId` enforces Admin, the owning campaign's DM, or —
// for a shared-catalog creature — any DM.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const updated = await updateCreature(id, body);
    return Response.json(updated);
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not update creature";
    return Response.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await deleteCreature(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not remove creature";
    return Response.json({ error: message }, { status });
  }
}
