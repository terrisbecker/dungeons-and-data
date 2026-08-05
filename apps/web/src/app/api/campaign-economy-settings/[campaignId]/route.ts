import { ApiRequestError, updateCampaignEconomySettings } from "@/lib/api";

// BFF proxy for the economy toggle + floor/ceiling form. Forwards to the API,
// whose guardCampaignEconomySettingsByParamId enforces Admin-or-DM-of-this-campaign.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { campaignId } = await params;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const updated = await updateCampaignEconomySettings(campaignId, body);
    return Response.json(updated);
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error
        ? error.message
        : "Could not update economy settings";
    return Response.json({ error: message }, { status });
  }
}
