import { ApiRequestError, joinCampaign } from "@/lib/api";

// BFF: proxy a self-service campaign join to the Express API. serverFetch
// attaches the JWT from the httpOnly session cookie, so the API seats the
// current player — the pasted id only identifies the campaign to join.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const membership = await joinCampaign(id);
    return Response.json(membership, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not join campaign";
    return Response.json({ error: message }, { status });
  }
}
