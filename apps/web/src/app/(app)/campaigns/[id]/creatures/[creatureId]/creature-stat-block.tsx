import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import type { CreatureStatBlock } from "@dnd/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CREATURE_KINDS,
  creatureSubtitle,
  formatChallengeRating,
} from "@/lib/creature-labels";
import {
  DamageModifiersSection,
  InventorySection,
  SkillsSection,
  StatBlockEntriesSection,
} from "./creature-child-sections";
import {
  AbilitiesSection,
  ChallengeSection,
  CreatureName,
  DefenseSection,
  DescriptionSection,
  SensesSection,
} from "./creature-core-sections";
import { DeleteCreatureDialog } from "./delete-creature-dialog";
import { PlacementsSection } from "./creature-placements-section";

// Server component: it renders the static header and composes the client
// sections that own the interactive parts. Every mutation goes through the BFF
// and then router.refresh(), so this re-runs and the server stays the single
// source of truth — including the recomputed `derived` block.
export function CreatureStatBlockView({
  campaignId,
  creature,
  canManage,
}: {
  campaignId: string;
  creature: CreatureStatBlock;
  canManage: boolean;
}) {
  const shared = creature.campaignId === null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/campaigns/${campaignId}/creatures`} />}
        >
          <ChevronLeftIcon />
          Back to creatures
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="font-heading flex flex-wrap items-center gap-2 text-lg font-medium">
            <CreatureName creature={creature} canManage={canManage} />
            <Badge variant="outline">{CREATURE_KINDS[creature.kind]}</Badge>
            {shared && <Badge variant="secondary">Shared bestiary</Badge>}
          </h1>
          <p className="text-muted-foreground text-sm">
            {creatureSubtitle(creature)}
          </p>
          <p className="text-muted-foreground text-xs tabular-nums">
            CR {formatChallengeRating(creature.challengeRating)}
            {creature.experiencePoints !== null &&
              ` · ${creature.experiencePoints} XP`}
            {creature.hasLair && " · has a lair"}
          </p>
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-2">
            <DeleteCreatureDialog campaignId={campaignId} creature={creature} />
          </div>
        )}
      </div>

      <DescriptionSection creature={creature} canManage={canManage} />
      <AbilitiesSection creature={creature} canManage={canManage} />
      <DefenseSection creature={creature} canManage={canManage} />
      <SensesSection creature={creature} canManage={canManage} />
      <ChallengeSection creature={creature} canManage={canManage} />
      <SkillsSection creature={creature} canManage={canManage} />
      <DamageModifiersSection creature={creature} canManage={canManage} />
      <StatBlockEntriesSection creature={creature} canManage={canManage} />
      <PlacementsSection
        campaignId={campaignId}
        creature={creature}
        canManage={canManage}
      />
      <InventorySection creature={creature} canManage={canManage} />
    </div>
  );
}
