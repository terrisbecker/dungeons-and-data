"use client";

import { toast } from "sonner";

// Every sheet mutation goes through the BFF (`/api/…`), which attaches the JWT
// from the httpOnly cookie — the token never reaches the browser. All helpers
// return a boolean and own their error toast, so callers only handle success.

async function send(
  url: string,
  method: string,
  body: unknown,
  fallback: string,
): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method,
      headers:
        body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const parsed = await res.json().catch(() => null);
      toast.error(parsed?.error ?? fallback);
      return false;
    }
    return true;
  } catch {
    toast.error("Could not reach the server");
    return false;
  }
}

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
