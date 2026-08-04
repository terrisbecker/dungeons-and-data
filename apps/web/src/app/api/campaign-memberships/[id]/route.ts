import { ApiRequestError, deleteMembership, updateMembership } from "@/lib/api";

// BFF proxy for editing a player's role / removing them from a campaign. Both
// verbs forward to the API, whose `guardMembershipByParamId` enforces
// Admin-or-that-campaign's-DM (and the ≥1-DM invariant on both writes).
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
    const updated = await updateMembership(id, body);
    return Response.json(updated);
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not update membership";
    return Response.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await deleteMembership(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not remove player";
    return Response.json({ error: message }, { status });
  }
}
