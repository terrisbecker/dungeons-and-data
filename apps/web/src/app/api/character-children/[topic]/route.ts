import { ApiRequestError, serverFetch } from "@/lib/api";

// BFF proxy for creating a character's child rows from the character sheet:
// owned children (classes, skills, spell slots, resources, proficiencies,
// conditions) and catalog joins (inventory items, spells, feats, features). The
// client posts the same body the API expects (including `characterId` + the
// catalog row id); the API's own guard verifies the caller may write that
// character, so we only need to allowlist the topic segment to avoid proxying to
// arbitrary paths.
const ALLOWED_TOPICS = new Set([
  "character-classes",
  "character-skills",
  "spell-slots",
  "character-resources",
  "proficiencies",
  "character-conditions",
  "inventory-items",
  "character-spells",
  "character-feats",
  "character-features",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ topic: string }> },
) {
  const { topic } = await params;
  if (!ALLOWED_TOPICS.has(topic)) {
    return Response.json({ error: "Unknown resource" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const created = await serverFetch<{ id: string }>(`/${topic}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return Response.json(created, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not add entry";
    return Response.json({ error: message }, { status });
  }
}
