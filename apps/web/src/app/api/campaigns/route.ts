import { ApiRequestError, createCampaign } from "@/lib/api";

// BFF: proxy campaign creation to the Express API. serverFetch attaches the JWT
// from the httpOnly session cookie, so the token never reaches the browser.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  try {
    const campaign = await createCampaign(body);
    return Response.json(campaign, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not create campaign";
    return Response.json({ error: message }, { status });
  }
}
