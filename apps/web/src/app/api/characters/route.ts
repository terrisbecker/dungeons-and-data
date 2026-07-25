import type { CreateCharacterInput } from "@dnd/shared";
import {
  ApiRequestError,
  createCharacter,
  createCharacterClass,
  createCharacterSkill,
  deleteCharacter,
  getMe,
} from "@/lib/api";

// BFF: orchestrate character creation across the API's character + owned-child
// endpoints (there is no bulk/transactional create). serverFetch attaches the
// JWT from the httpOnly session cookie, so the token never reaches the browser.
//
// The API's create guard only lets a plain USER create a character when
// `playerId === self`, so we inject the current player's id here and never trust
// the client for it.
export async function POST(request: Request) {
  const payload = (await request
    .json()
    .catch(() => null)) as CreateCharacterInput | null;

  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { classes = [], skills = [], ...scalars } = payload;

  let characterId: string | undefined;
  try {
    const me = await getMe();
    const created = await createCharacter({
      ...scalars,
      playerId: me.id,
      campaignId: scalars.campaignId || undefined,
    });
    characterId = created.id;

    // Owned children are separate endpoints; create them sequentially so a
    // failure is attributable and we can roll back the parent.
    for (const cls of classes) {
      await createCharacterClass({ ...cls, characterId });
    }
    for (const skill of skills) {
      await createCharacterSkill({ ...skill, characterId });
    }

    return Response.json({ id: characterId }, { status: 201 });
  } catch (error) {
    // Best-effort rollback: soft-delete the half-built character so a failed
    // child step doesn't leave an orphan draft behind.
    if (characterId) {
      await deleteCharacter(characterId).catch(() => {});
    }
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not create character";
    return Response.json({ error: message }, { status });
  }
}
