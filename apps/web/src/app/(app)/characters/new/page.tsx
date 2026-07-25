import { redirect } from "next/navigation";
import type { MeResponse } from "@dnd/shared";
import { ApiRequestError, getMe } from "@/lib/api";
import { CharacterWizard } from "./character-wizard";

export default async function NewCharacterPage() {
  let me: MeResponse;
  try {
    me = await getMe();
  } catch (error) {
    // Token missing/expired at the API — clear it and bounce to login (a plain
    // redirect would loop against the proxy, which still sees the cookie).
    if (error instanceof ApiRequestError && error.status === 401) {
      redirect("/api/auth/logout");
    }
    throw error;
  }

  const campaigns = me.memberships.map((m) => ({
    id: m.campaign.id,
    name: m.campaign.name,
  }));

  return <CharacterWizard campaigns={campaigns} />;
}
