import { ApiRequestError, createLocation } from "@/lib/api";

// BFF proxy for creating a location. No auth logic here — serverFetch attaches
// the session cookie's Bearer token and the API's `guardLocationCreate` enforces
// Admin-or-DM-of-that-campaign.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const created = await createLocation(body);
    return Response.json(created, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not create location";
    return Response.json({ error: message }, { status });
  }
}
