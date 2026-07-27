import Link from "next/link";
import type { Campaign, CharacterSummary } from "@dnd/shared";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROLE_LABEL } from "../roster-row";

function CharacterRow({ character }: { character: CharacterSummary }) {
  return (
    <Link
      href={`/characters/${character.id}`}
      className="hover:bg-muted/50 flex items-center justify-between rounded-md border p-3 transition-colors"
    >
      <div>
        <p className="font-medium">{character.characterName}</p>
        <p className="text-muted-foreground text-xs">
          Level {character.totalLevel} {character.race}
        </p>
      </div>
      <span className="text-muted-foreground text-sm">
        HP {character.currentHitPoints}/{character.maxHitPoints} · AC{" "}
        {character.armorClass}
      </span>
    </Link>
  );
}

// The whole campaign's characters, grouped by the player who owns them. Stays
// a server component — there are no write actions here, just navigation into
// the existing (read-open) character sheet page.
export function CharactersRoster({
  campaign,
  characters,
}: {
  campaign: Campaign;
  characters: CharacterSummary[];
}) {
  const memberPlayerIds = new Set(
    campaign.memberships.map((m) => m.player.id),
  );
  const charactersByPlayer = new Map<string, CharacterSummary[]>();
  for (const character of characters) {
    if (!character.playerId || !memberPlayerIds.has(character.playerId)) {
      continue;
    }
    const existing = charactersByPlayer.get(character.playerId);
    if (existing) {
      existing.push(character);
    } else {
      charactersByPlayer.set(character.playerId, [character]);
    }
  }
  const unassigned = characters.filter(
    (c) => !c.playerId || !memberPlayerIds.has(c.playerId),
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-lg font-medium">Characters</h1>
        <p className="text-muted-foreground text-sm">
          Every player in this campaign and the character(s) they play.
        </p>
      </div>

      {campaign.memberships.map((m) => {
        const owned = charactersByPlayer.get(m.player.id) ?? [];
        return (
          <Card key={m.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{m.player.displayName ?? m.player.username}</CardTitle>
                <Badge variant="outline">{ROLE_LABEL[m.role]}</Badge>
              </div>
              <CardDescription>
                {owned.length === 0
                  ? "No characters yet."
                  : `${owned.length} character(s).`}
              </CardDescription>
            </CardHeader>
            {owned.length > 0 && (
              <CardContent className="flex flex-col gap-2">
                {owned.map((character) => (
                  <CharacterRow key={character.id} character={character} />
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}

      {unassigned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unassigned</CardTitle>
            <CardDescription>
              Characters in this campaign whose player is no longer a member.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {unassigned.map((character) => (
              <CharacterRow key={character.id} character={character} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
