// Plain module (no "use client") so both server and client components can
// share it — mirrors lib/creature-labels.ts.

// A location counts as a "building" (and gets a building inventory) when its
// free-text `type` is exactly "building", case-insensitively. This is a
// frontend-only convention — the API has no notion of "building" and will
// let any location own InventoryItem rows; this is just where the UI decides
// whether to render the building-inventory section.
export function isBuildingType(type: string): boolean {
  return type.trim().toLowerCase() === "building";
}
