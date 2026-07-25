import type { LocationRow } from "@dnd/shared";

// Pure helpers over the flat `GET /locations?campaignId=…` list. The API returns
// every location in one array with a `parentId` on each row, so the hierarchy —
// breadcrumb ancestry, a level's children, the descendant set a re-parent has to
// avoid — is derived here rather than fetched level by level.
//
// Every walk carries a `visited` set: the API now rejects parent cycles, but
// rows already in the database predate that check, and a loop must not hang the
// render.

export type LocationIndex = Map<string, LocationRow>;

export function indexLocations(all: LocationRow[]): LocationIndex {
  return new Map(all.map((row) => [row.id, row]));
}

// Ancestors of `id`, root first, excluding the location itself. Rows whose
// parent sits outside the campaign list simply stop the walk.
export function ancestorsOf(id: string, index: LocationIndex): LocationRow[] {
  const chain: LocationRow[] = [];
  const visited = new Set<string>([id]);
  let cursor = index.get(id)?.parentId ?? null;
  while (cursor !== null && !visited.has(cursor)) {
    visited.add(cursor);
    const row = index.get(cursor);
    if (!row) break;
    chain.push(row);
    cursor = row.parentId;
  }
  return chain.reverse();
}

// Direct children of a level; `null` yields the campaign's top-level locations.
export function childrenOf(
  parentId: string | null,
  all: LocationRow[],
): LocationRow[] {
  return all.filter((row) => row.parentId === parentId);
}

// `id` plus everything beneath it — the ids that must not be offered as a new
// parent for `id`, since either choice would create a loop.
export function descendantIdsOf(id: string, all: LocationRow[]): Set<string> {
  const byParent = new Map<string, LocationRow[]>();
  for (const row of all) {
    if (row.parentId === null) continue;
    const siblings = byParent.get(row.parentId);
    if (siblings) siblings.push(row);
    else byParent.set(row.parentId, [row]);
  }

  const blocked = new Set<string>([id]);
  const queue = [id];
  while (queue.length > 0) {
    const next = queue.pop() as string;
    for (const child of byParent.get(next) ?? []) {
      if (blocked.has(child.id)) continue;
      blocked.add(child.id);
      queue.push(child.id);
    }
  }
  return blocked;
}

// "Aldermere › Silverpine Forest › Thornwick" — used to label parent options so
// same-named locations in different branches stay distinguishable.
export function pathLabel(row: LocationRow, index: LocationIndex): string {
  return [...ancestorsOf(row.id, index), row]
    .map((step) => step.locationName)
    .join(" › ");
}
