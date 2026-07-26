"use client";

import { send } from "@/lib/mutate";

// The stat block's write surface, one helper per BFF endpoint it uses. `send`
// owns the error toast and returns a boolean, so callers only handle success.

// The main Creature row. PATCH is partial, so each inline editor sends only
// its own field.
export function patchCreature(id: string, body: unknown): Promise<boolean> {
  return send(`/api/creatures/${id}`, "PATCH", body, "Could not save changes");
}

export function deleteCreature(id: string): Promise<boolean> {
  return send(
    `/api/creatures/${id}`,
    "DELETE",
    undefined,
    "Could not remove creature",
  );
}

// Owned children: creature-skills, stat-block-entries, creature-damage-modifiers.
export function postCreatureChild(
  topic: string,
  body: unknown,
): Promise<boolean> {
  return send(
    `/api/creature-children/${topic}`,
    "POST",
    body,
    "Could not add entry",
  );
}

export function patchCreatureChild(
  topic: string,
  id: string,
  body: unknown,
): Promise<boolean> {
  return send(
    `/api/creature-children/${topic}/${id}`,
    "PATCH",
    body,
    "Could not save changes",
  );
}

export function deleteCreatureChild(
  topic: string,
  id: string,
): Promise<boolean> {
  return send(
    `/api/creature-children/${topic}/${id}`,
    "DELETE",
    undefined,
    "Could not remove entry",
  );
}

// Placements are keyed on (creatureId, locationId) rather than an id.
export function postPlacement(body: unknown): Promise<boolean> {
  return send(
    "/api/creature-placements",
    "POST",
    body,
    "Could not place creature",
  );
}

export function patchPlacement(
  creatureId: string,
  locationId: string,
  body: unknown,
): Promise<boolean> {
  return send(
    `/api/creature-placements/${creatureId}/${locationId}`,
    "PATCH",
    body,
    "Could not save changes",
  );
}

export function deletePlacement(
  creatureId: string,
  locationId: string,
): Promise<boolean> {
  return send(
    `/api/creature-placements/${creatureId}/${locationId}`,
    "DELETE",
    undefined,
    "Could not remove placement",
  );
}
