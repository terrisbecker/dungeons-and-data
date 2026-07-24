import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import type { Ability, CharacterSheet } from "@dnd/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

// --- Presentational reference data -----------------------------------------

const ABILITIES: {
  key: Ability;
  label: string;
  score: keyof Pick<
    CharacterSheet,
    | "strength"
    | "dexterity"
    | "constitution"
    | "intelligence"
    | "wisdom"
    | "charisma"
  >;
  save: keyof Pick<
    CharacterSheet,
    | "strengthSaveProf"
    | "dexteritySaveProf"
    | "constitutionSaveProf"
    | "intelligenceSaveProf"
    | "wisdomSaveProf"
    | "charismaSaveProf"
  >;
}[] = [
  {
    key: "STR",
    label: "Strength",
    score: "strength",
    save: "strengthSaveProf",
  },
  {
    key: "DEX",
    label: "Dexterity",
    score: "dexterity",
    save: "dexteritySaveProf",
  },
  {
    key: "CON",
    label: "Constitution",
    score: "constitution",
    save: "constitutionSaveProf",
  },
  {
    key: "INT",
    label: "Intelligence",
    score: "intelligence",
    save: "intelligenceSaveProf",
  },
  { key: "WIS", label: "Wisdom", score: "wisdom", save: "wisdomSaveProf" },
  {
    key: "CHA",
    label: "Charisma",
    score: "charisma",
    save: "charismaSaveProf",
  },
];

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

function fmt(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

// --- Layout primitives -----------------------------------------------------

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

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

  const senses = [
    sheet.darkvision ? `Darkvision ${sheet.darkvision} ft.` : null,
  ].filter(Boolean);

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

      {/* Header */}
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
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Level {d.totalLevel}</Badge>
          <Badge variant="secondary">
            Proficiency {fmt(d.proficiencyBonus)}
          </Badge>
          {sheet.inspiration && <Badge>Inspiration</Badge>}
        </div>
      </div>

      <div className="grid gap-4">
        {/* Combat */}
        <Card>
          <CardHeader>
            <CardTitle>Combat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat
                label="Hit Points"
                value={
                  <>
                    {sheet.currentHitPoints}/{sheet.maxHitPoints}
                    {sheet.temporaryHitPoints > 0 && (
                      <span className="text-muted-foreground text-sm">
                        {" "}
                        +{sheet.temporaryHitPoints}
                      </span>
                    )}
                  </>
                }
              />
              <Stat label="Armor Class" value={sheet.armorClass} />
              <Stat label="Initiative" value={fmt(d.initiative)} />
              <Stat label="Speed" value={`${sheet.speed} ft.`} />
              <Stat label="Passive Perception" value={d.passivePerception} />
              <Stat
                label="Passive Investigation"
                value={d.passiveInvestigation}
              />
              <Stat label="Passive Insight" value={d.passiveInsight} />
              <Stat
                label="Death Saves"
                value={`${sheet.deathSaveSuccesses}✓ / ${sheet.deathSaveFailures}✗`}
              />
            </div>
            {(sheet.flySpeed ||
              sheet.swimSpeed ||
              sheet.climbSpeed ||
              senses.length > 0) && (
              <p className="text-muted-foreground mt-3 text-sm">
                {[
                  sheet.flySpeed ? `Fly ${sheet.flySpeed} ft.` : null,
                  sheet.swimSpeed ? `Swim ${sheet.swimSpeed} ft.` : null,
                  sheet.climbSpeed ? `Climb ${sheet.climbSpeed} ft.` : null,
                  ...senses,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Abilities & saves */}
        <Card>
          <CardHeader>
            <CardTitle>Ability Scores & Saving Throws</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {ABILITIES.map((a) => (
                <div key={a.key} className="rounded-lg border p-3 text-center">
                  <p className="text-muted-foreground text-xs">{a.label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {sheet[a.score]}
                  </p>
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {fmt(d.abilityModifiers[a.key])}
                  </p>
                  <Separator className="my-2" />
                  <p
                    className={
                      sheet[a.save]
                        ? "text-sm font-semibold tabular-nums"
                        : "text-muted-foreground text-sm tabular-nums"
                    }
                  >
                    Save {fmt(d.savingThrows[a.key])}
                    {sheet[a.save] && " ●"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Classes */}
        <ClassesSection characterId={sheet.id} classes={sheet.classes} />

        {/* Skills */}
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
                    Attack {fmt(sc.attackBonus)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Spell slots */}
        <SpellSlotsSection
          characterId={sheet.id}
          spellSlots={sheet.spellSlots}
        />

        {/* Spells (catalog) */}
        <SpellsSection characterId={sheet.id} spells={sheet.spells} />

        {/* Resources */}
        <ResourcesSection characterId={sheet.id} resources={sheet.resources} />

        {/* Conditions */}
        <ConditionsSection
          characterId={sheet.id}
          conditions={sheet.conditions}
        />

        {/* Features (catalog) */}
        <FeaturesSection characterId={sheet.id} features={sheet.features} />

        {/* Feats (catalog) */}
        <FeatsSection characterId={sheet.id} feats={sheet.feats} />

        {/* Proficiencies */}
        <ProficienciesSection
          characterId={sheet.id}
          proficiencies={sheet.proficiencies}
        />

        {/* Inventory (catalog) */}
        <InventorySection characterId={sheet.id} inventory={sheet.inventory} />

        {/* Currency */}
        <Card>
          <CardHeader>
            <CardTitle>Coin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 text-center text-sm">
              <Coin label="PP" value={sheet.platinum} />
              <Coin label="GP" value={sheet.gold} />
              <Coin label="EP" value={sheet.electrum} />
              <Coin label="SP" value={sheet.silver} />
              <Coin label="CP" value={sheet.copper} />
            </div>
          </CardContent>
        </Card>

        {/* Roleplay */}
        {(sheet.description ||
          sheet.traits ||
          sheet.ideals ||
          sheet.bonds ||
          sheet.flaws) && (
          <Card>
            <CardHeader>
              <CardTitle>Roleplay</CardTitle>
              <CardDescription>
                Personality, ideals, bonds, and flaws.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Prose label="Description" text={sheet.description} />
              <Prose label="Personality Traits" text={sheet.traits} />
              <Prose label="Ideals" text={sheet.ideals} />
              <Prose label="Bonds" text={sheet.bonds} />
              <Prose label="Flaws" text={sheet.flaws} />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function Coin({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Prose({ label, text }: { label: string; text: string | null }) {
  if (!text) return null;
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{text}</p>
    </div>
  );
}
