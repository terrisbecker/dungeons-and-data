import { ApiRequestError, serverFetch } from "@/lib/api";

// BFF proxy for one (location, item type) supply/demand override. Forwards
// to the API, whose guardLocationItemEconomyByParams enforces the same rule
// as the location's own sliders.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ locationId: string; itemType: string }> },
) {
  const { locationId, itemType } = await params;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const updated = await serverFetch(
      `/location-item-economy/${encodeURIComponent(locationId)}/${encodeURIComponent(itemType)}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
    return Response.json(updated);
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not update economy";
    return Response.json({ error: message }, { status });
  }
}
