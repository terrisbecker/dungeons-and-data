"use client";

import { send } from "@/lib/mutate";

// The character sheet's write surface, one helper per BFF endpoint it uses.
// `send` owns the error toast and returns a boolean, so callers only handle
// success.

export function postChild(topic: string, body: unknown): Promise<boolean> {
  return send(
    `/api/character-children/${topic}`,
    "POST",
    body,
    "Could not add entry",
  );
}

export function patchChild(
  topic: string,
  id: string,
  body: unknown,
): Promise<boolean> {
  return send(
    `/api/character-children/${topic}/${id}`,
    "PATCH",
    body,
    "Could not save changes",
  );
}

export function deleteChild(topic: string, id: string): Promise<boolean> {
  return send(
    `/api/character-children/${topic}/${id}`,
    "DELETE",
    undefined,
    "Could not remove entry",
  );
}

// The composite-key catalog joins are addressed by /:characterId/:otherId.
export function deleteJoin(
  topic: string,
  characterId: string,
  otherId: string,
): Promise<boolean> {
  return send(
    `/api/character-children/${topic}/${characterId}/${otherId}`,
    "DELETE",
    undefined,
    "Could not remove entry",
  );
}

// The main PlayerCharacter row. PATCH is partial, so each inline editor sends
// only its own field.
export function patchCharacter(id: string, body: unknown): Promise<boolean> {
  return send(`/api/characters/${id}`, "PATCH", body, "Could not save changes");
}
