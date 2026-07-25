import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import type { CharacterSheet } from "@dnd/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatModifier } from "@/lib/utils";
import {
  AbilitiesSection,
  CoinSection,
  CombatSection,
  ProgressBadges,
  RoleplaySection,
} from "./character-sheet-hub-sections";
import {
  ClassesSection,
  ConditionsSection,
  ProficienciesSection,
  ResourcesSection,
  SkillsSection,
  SpellSlotsSection,
} from "./character-sheet-sections";
import {
  FeatsSection,
  FeaturesSection,
  InventorySection,
  SpellsSection,
} from "./character-sheet-catalog-sections";

// Server component: it renders the static header and the derived Spellcasting
// card itself, and composes the client sections that own the interactive parts.
// Everything mutates through the BFF and then calls router.refresh(), so this
// re-runs and the server stays the single source of truth (including the
// recomputed `derived` block).

// --- Presentational reference data -----------------------------------------

const ALIGNMENTS: Record<string, string> = {
  LG: "Lawful Good",
  NG: "Neutral Good",
  CG: "Chaotic Good",
  LN: "Lawful Neutral",
  TN: "True Neutral",
  CN: "Chaotic Neutral",
  LE: "Lawful Evil",
  NE: "Neutral Evil",
  CE: "Chaotic Evil",
};

const SIZES: Record<string, string> = {
  TINY: "Tiny",
  SMALL: "Small",
  MEDIUM: "Medium",
  LARGE: "Large",
  HUGE: "Huge",
  GARGANTUAN: "Gargantuan",
};

// --- Main view -------------------------------------------------------------

export function CharacterSheetView({ sheet }: { sheet: CharacterSheet }) {
  const d = sheet.derived;

  const classLine = sheet.classes.length
    ? sheet.classes
        .map(
          (c) =>
            `${c.className}${c.subclass ? ` (${c.subclass})` : ""} ${c.level}`,
        )
        .join(" / ")
    : "No classes";

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard" />}
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Button>
      </div>

      {/* Header. Name and race are create-only on the API, so they stay static. */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{sheet.characterName}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {[
              sheet.subrace ? `${sheet.subrace} ${sheet.race}` : sheet.race,
              classLine,
            ].join(" · ")}
          </p>
          <p className="text-muted-foreground text-sm">
            {[
              SIZES[sheet.size] ?? sheet.size,
              sheet.alignment
                ? (ALIGNMENTS[sheet.alignment] ?? sheet.alignment)
                : null,
              sheet.background,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Level {d.totalLevel}</Badge>
          <Badge variant="secondary">
            Proficiency {formatModifier(d.proficiencyBonus)}
          </Badge>
          <ProgressBadges
            characterId={sheet.id}
            inspiration={sheet.inspiration}
            experiencePoints={sheet.experiencePoints}
          />
        </div>
      </div>

      <div className="grid gap-4">
        <CombatSection characterId={sheet.id} sheet={sheet} derived={d} />

        <AbilitiesSection characterId={sheet.id} sheet={sheet} derived={d} />

        <ClassesSection characterId={sheet.id} classes={sheet.classes} />

        <SkillsSection
          characterId={sheet.id}
          skills={sheet.skills}
          skillModifiers={d.skills}
        />

        {/* Spellcasting (computed save DC / attack) */}
        {d.spellcasting.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Spellcasting</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {d.spellcasting.map((sc) => (
                <div
                  key={sc.className}
                  className="flex flex-wrap items-center gap-2 text-sm"
                >
                  <span className="font-medium">{sc.className}</span>
                  <span className="text-muted-foreground">({sc.ability})</span>
                  <Badge variant="secondary">Save DC {sc.saveDc}</Badge>
                  <Badge variant="secondary">
                    Attack {formatModifier(sc.attackBonus)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <SpellSlotsSection
          characterId={sheet.id}
          spellSlots={sheet.spellSlots}
        />

        <SpellsSection characterId={sheet.id} spells={sheet.spells} />

        <ResourcesSection characterId={sheet.id} resources={sheet.resources} />

        <ConditionsSection
          characterId={sheet.id}
          conditions={sheet.conditions}
        />

        <FeaturesSection characterId={sheet.id} features={sheet.features} />

        <FeatsSection characterId={sheet.id} feats={sheet.feats} />

        <ProficienciesSection
          characterId={sheet.id}
          proficiencies={sheet.proficiencies}
        />

        <InventorySection characterId={sheet.id} inventory={sheet.inventory} />

        <CoinSection characterId={sheet.id} sheet={sheet} />

        <RoleplaySection characterId={sheet.id} sheet={sheet} />
      </div>
    </main>
  );
}
