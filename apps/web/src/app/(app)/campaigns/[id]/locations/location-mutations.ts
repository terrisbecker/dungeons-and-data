"use client";

import { send } from "@/lib/mutate";

// Owned children of a location — currently just inventory-items (building
// stock). Mirrors creature-mutations.ts.
export function postLocationChild(
  topic: string,
  body: unknown,
): Promise<boolean> {
  return send(
    `/api/location-children/${topic}`,
    "POST",
    body,
    "Could not add entry",
  );
}

export function patchLocationChild(
  topic: string,
  id: string,
  body: unknown,
): Promise<boolean> {
  return send(
    `/api/location-children/${topic}/${id}`,
    "PATCH",
    body,
    "Could not save changes",
  );
}

export function deleteLocationChild(
  topic: string,
  id: string,
): Promise<boolean> {
  return send(
    `/api/location-children/${topic}/${id}`,
    "DELETE",
    undefined,
    "Could not remove entry",
  );
}
