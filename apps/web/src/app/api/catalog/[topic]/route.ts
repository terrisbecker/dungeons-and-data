import { ApiRequestError, serverFetch } from "@/lib/api";

// BFF proxy for the shared catalogs. GET (list) is open to any authed user — it
// feeds both the DM/Admin management pages and the character-sheet pickers.
// POST (create) is forwarded as-is; the API's `guardCatalog` enforces that only
// an Admin or a DM may write, so a plain player's create still 403s.
const ALLOWED_TOPICS = new Set(["items", "spells", "feats", "features"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ topic: string }> },
) {
  const { topic } = await params;
  if (!ALLOWED_TOPICS.has(topic)) {
    return Response.json({ error: "Unknown catalog" }, { status: 404 });
  }

  try {
    const rows = await serverFetch<unknown[]>(`/${topic}`);
    return Response.json(rows);
  } catch (error) {
    const status = error instanceof ApiRequestError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Could not load catalog";
    return Response.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ topic: string }> },
) {
  const { topic } = await params;
  if (!ALLOWED_TOPICS.has(topic)) {
    return Response.json({ error: "Unknown catalog" }, { status: 404 });
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
      error instanceof Error ? error.message : "Could not create entry";
    return Response.json({ error: message }, { status });
  }
}
