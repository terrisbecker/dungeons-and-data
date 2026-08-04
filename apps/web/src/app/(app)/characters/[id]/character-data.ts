import type { CharacterSheet, MeResponse } from "@dnd/shared";

// Mirrors assertCanWriteCharacter in the API (apps/api/src/auth/authz.ts):
// Admin, the owning player, or the DM of the character's campaign. Used only
// to decide what to render; the API guard still enforces it on every write.
export function canManageCharacter(
  me: MeResponse,
  sheet: Pick<CharacterSheet, "playerId" | "campaignId">,
): boolean {
  return (
    me.systemRole === "ADMIN" ||
    (sheet.playerId !== null && sheet.playerId === me.id) ||
    (sheet.campaignId !== null &&
      me.memberships.some(
        (m) =>
          m.campaign.id === sheet.campaignId && m.role === "DUNGEON_MASTER",
      ))
  );
}
