import { ApiRequestError, serverFetch } from "@/lib/api";

// BFF proxy for the character sheet's inline edits of the main PlayerCharacter
// row (PATCH /characters/:id). The body is forwarded as-is: the API validates
// every field and `guardCharacterByParamId` enforces Admin / the campaign's DM /
// the owning player, so nothing here needs to know the field set. A malformed
// id is rejected by the API's own uuid check.
//
// Note the API answers with the lean *core* character (scalars + classes +
// skills + derived), not the full sheet — the sheet re-reads itself with
// router.refresh() rather than consuming this body.
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
    const updated = await serverFetch<{ id: string }>(
      `/characters/${encodeURIComponent(id)}`,
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
