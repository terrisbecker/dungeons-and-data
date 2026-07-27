import { ApiRequestError, leaveCampaign } from "@/lib/api";

// BFF: proxy a self-service campaign leave to the Express API. serverFetch
// attaches the JWT from the httpOnly session cookie, so the API only ever
// removes the caller's own seat — the id only identifies the campaign.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await leaveCampaign(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not leave campaign";
    return Response.json({ error: message }, { status });
  }
}
