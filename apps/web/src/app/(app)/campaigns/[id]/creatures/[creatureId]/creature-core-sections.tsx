"use client";

import { toast } from "sonner";
import type { Ability, CreatureStatBlock } from "@dnd/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  EditableNumber,
  EditableText,
  EditableToggle,
} from "@/components/editable-fields";
import { useOptimisticField } from "@/hooks/use-optimistic-field";
import {
  formatChallengeRating,
  parseChallengeRating,
} from "@/lib/creature-labels";
import { formatModifier } from "@/lib/utils";
import { patchCreature } from "./creature-mutations";

// The interactive half of the creature stat block: every stored scalar on the
// Creature row, edited in place. Derived values (proficiency bonus, saves,
// skill bonuses, the passives) render read-only — the API recomputes them from
// the scalars on every read.
//
// PATCH /creatures/:id is partial, so each field owns its own
// useOptimisticField instance and sends only itself. A viewer without write
// permission gets the same layout with plain text in place of the editors.

const ABILITIES: {
  key: Ability;
  label: string;
  score:
    | "strength"
    | "dexterity"
    | "constitution"
    | "intelligence"
    | "wisdom"
    | "charisma";
  save:
    | "strengthSaveProf"
    | "dexteritySaveProf"
    | "constitutionSaveProf"
    | "intelligenceSaveProf"
    | "wisdomSaveProf"
    | "charismaSaveProf";
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

const ABILITY_MIN = 1;
const ABILITY_MAX = 30;

// --- Field wrappers ---------------------------------------------------------

interface FieldProps {
  creatureId: string;
  label: string;
  field: string;
  canManage: boolean;
}

function NumberField({
  creatureId,
  label,
  field,
  value,
  canManage,
  min = 0,
  max,
  nullable = false,
  render,
}: FieldProps & {
  value: number | null;
  min?: number;
  max?: number;
  nullable?: boolean;
  render?: (value: number | null) => React.ReactNode;
}) {
  const state = useOptimisticField(value, (next) =>
    patchCreature(creatureId, { [field]: next }),
  );
  if (!canManage) {
    return <span>{render ? render(value) : (value ?? "—")}</span>;
  }
  return (
    <EditableNumber
      label={label}
      value={state.value}
      onCommit={(next) => {
        if (!nullable && next === null) return;
        state.set(next);
      }}
      pending={state.pending}
      min={min}
      max={max}
      nullable={nullable}
      render={render}
    />
  );
}

function TextField({
  creatureId,
  label,
  field,
  value,
  canManage,
  multiline = false,
}: FieldProps & { value: string | null; multiline?: boolean }) {
  const state = useOptimisticField(value, (next) =>
    patchCreature(creatureId, { [field]: next }),
  );
  if (!canManage) {
    return (
      <span className={value ? "whitespace-pre-wrap" : "text-muted-foreground"}>
        {value ?? "—"}
      </span>
    );
  }
  return (
    <EditableText
      label={label}
      value={state.value}
      onCommit={state.set}
      pending={state.pending}
      multiline={multiline}
      className="text-sm"
    />
  );
}

function ToggleField({
  creatureId,
  label,
  field,
  value,
  canManage,
}: FieldProps & { value: boolean }) {
  const state = useOptimisticField(value, (next) =>
    patchCreature(creatureId, { [field]: next }),
  );
  if (!canManage) {
    return (
      <span className="text-sm">
        {label}: {value ? "yes" : "no"}
      </span>
    );
  }
  return (
    <EditableToggle
      label={label}
      value={state.value}
      onCommit={state.set}
      pending={state.pending}
    />
  );
}

// Postgres text[] columns (type tags, condition immunities, environment) are
// edited as one comma-separated line — a list editor would be heavier than the
// data deserves.
function ListField({
  creatureId,
  label,
  field,
  value,
  canManage,
}: FieldProps & { value: string[] }) {
  const state = useOptimisticField(value, (next) =>
    patchCreature(creatureId, { [field]: next }),
  );
  const text = state.value.length ? state.value.join(", ") : null;
  if (!canManage) {
    return <span>{text ?? "—"}</span>;
  }
  return (
    <EditableText
      label={label}
      value={text}
      onCommit={(next) =>
        state.set(
          next === null
            ? []
            : next
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean),
        )
      }
      pending={state.pending}
      className="text-sm"
    />
  );
}

// CR is stored as a decimal but written as a fraction, so it rides on the text
// editor with a parse step rather than the number one.
function ChallengeRatingField({
  creatureId,
  value,
  canManage,
}: {
  creatureId: string;
  value: number | null;
  canManage: boolean;
}) {
  const state = useOptimisticField(value, (next) =>
    patchCreature(creatureId, { challengeRating: next }),
  );
  if (!canManage) {
    return <span>{formatChallengeRating(value)}</span>;
  }
  return (
    <EditableText
      label="Challenge rating"
      value={state.value === null ? null : formatChallengeRating(state.value)}
      onCommit={(next) => {
        if (next === null) {
          state.set(null);
          return;
        }
        const parsed = parseChallengeRating(next);
        if (parsed === undefined) {
          toast.error("Challenge rating must be a number (1/8, 1/4, 5…).");
          return;
        }
        state.set(parsed);
      }}
      pending={state.pending}
      className="text-sm"
    />
  );
}

// A labelled line inside one of the cards below.
function Line({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="tabular-nums">{children}</span>
    </div>
  );
}

// --- Abilities --------------------------------------------------------------

export function AbilitiesSection({
  creature,
  canManage,
}: {
  creature: CreatureStatBlock;
  canManage: boolean;
}) {
  const derived = creature.derived;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ability Scores &amp; Saving Throws</CardTitle>
        <CardDescription>
          Modifiers and save totals are computed; the proficiency bonus (
          {formatModifier(derived.proficiencyBonus)}) comes from the challenge
          rating.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {ABILITIES.map((ability) => (
            <div
              key={ability.key}
              className="rounded-lg border p-3 text-center"
            >
              <p className="text-muted-foreground text-xs">{ability.label}</p>
              <p className="mt-1 text-2xl font-semibold">
                <NumberField
                  creatureId={creature.id}
                  label={ability.label}
                  field={ability.score}
                  value={creature[ability.score]}
                  canManage={canManage}
                  min={ABILITY_MIN}
                  max={ABILITY_MAX}
                />
              </p>
              <p className="text-muted-foreground text-sm tabular-nums">
                {formatModifier(derived.abilityModifiers[ability.key])}
              </p>
              <Separator className="my-2" />
              <p className="text-sm tabular-nums">
                Save {formatModifier(derived.savingThrows[ability.key])}
              </p>
              <div className="mt-1 flex justify-center">
                <ToggleField
                  creatureId={creature.id}
                  label="Proficient"
                  field={ability.save}
                  value={creature[ability.save]}
                  canManage={canManage}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Defense + movement -----------------------------------------------------

export function DefenseSection({
  creature,
  canManage,
}: {
  creature: CreatureStatBlock;
  canManage: boolean;
}) {
  const id = creature.id;
  const feet = (value: number | null) =>
    value === null ? "—" : `${value} ft.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Defense &amp; Movement</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Line label="Armor class">
            <NumberField
              creatureId={id}
              label="Armor class"
              field="armorClass"
              value={creature.armorClass}
              canManage={canManage}
            />
          </Line>
          <Line label="AC note">
            <TextField
              creatureId={id}
              label="AC note"
              field="armorClassNote"
              value={creature.armorClassNote}
              canManage={canManage}
            />
          </Line>
          <Line label="Hit points">
            <NumberField
              creatureId={id}
              label="Hit points"
              field="hitPoints"
              value={creature.hitPoints}
              canManage={canManage}
            />
          </Line>
          <Line label="Hit dice">
            <TextField
              creatureId={id}
              label="Hit dice"
              field="hitDice"
              value={creature.hitDice}
              canManage={canManage}
            />
          </Line>
          <Line label="Initiative">
            {formatModifier(creature.derived.initiative)}
          </Line>
        </div>

        <div className="flex flex-col gap-2">
          <Line label="Speed">
            <NumberField
              creatureId={id}
              label="Speed"
              field="speed"
              value={creature.speed}
              canManage={canManage}
              render={feet}
            />
          </Line>
          {(
            [
              ["Fly", "flySpeed", creature.flySpeed],
              ["Swim", "swimSpeed", creature.swimSpeed],
              ["Climb", "climbSpeed", creature.climbSpeed],
              ["Burrow", "burrowSpeed", creature.burrowSpeed],
            ] as const
          ).map(([label, field, value]) => (
            <Line key={field} label={label}>
              <NumberField
                creatureId={id}
                label={label}
                field={field}
                value={value}
                canManage={canManage}
                nullable
                render={feet}
              />
            </Line>
          ))}
          <ToggleField
            creatureId={id}
            label="Can hover"
            field="hover"
            value={creature.hover}
            canManage={canManage}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// --- Senses + challenge -----------------------------------------------------

export function SensesSection({
  creature,
  canManage,
}: {
  creature: CreatureStatBlock;
  canManage: boolean;
}) {
  const id = creature.id;
  const derived = creature.derived;
  const feet = (value: number | null) =>
    value === null ? "—" : `${value} ft.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Senses &amp; Languages</CardTitle>
        <CardDescription>
          Passive Perception {derived.passivePerception} · Investigation{" "}
          {derived.passiveInvestigation} · Insight {derived.passiveInsight}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          {(
            [
              ["Darkvision", "darkvision", creature.darkvision],
              ["Blindsight", "blindsight", creature.blindsight],
              ["Tremorsense", "tremorsense", creature.tremorsense],
              ["Truesight", "truesight", creature.truesight],
            ] as const
          ).map(([label, field, value]) => (
            <Line key={field} label={label}>
              <NumberField
                creatureId={id}
                label={label}
                field={field}
                value={value}
                canManage={canManage}
                nullable
                render={feet}
              />
            </Line>
          ))}
          <ToggleField
            creatureId={id}
            label="Blind beyond that radius"
            field="blindBeyond"
            value={creature.blindBeyond}
            canManage={canManage}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Line label="Languages">
            <TextField
              creatureId={id}
              label="Languages"
              field="languages"
              value={creature.languages}
              canManage={canManage}
            />
          </Line>
          <Line label="Condition immunities">
            <ListField
              creatureId={id}
              label="Condition immunities"
              field="conditionImmunities"
              value={creature.conditionImmunities}
              canManage={canManage}
            />
          </Line>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChallengeSection({
  creature,
  canManage,
}: {
  creature: CreatureStatBlock;
  canManage: boolean;
}) {
  const id = creature.id;
  const isMonster = creature.kind === "MONSTER";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isMonster ? "Challenge" : "Details"}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Line label="Challenge rating">
            <ChallengeRatingField
              creatureId={id}
              value={creature.challengeRating}
              canManage={canManage}
            />
          </Line>
          <Line label="Experience points">
            <NumberField
              creatureId={id}
              label="Experience points"
              field="experiencePoints"
              value={creature.experiencePoints}
              canManage={canManage}
              nullable
            />
          </Line>
          <Line label="Legendary actions / round">
            <NumberField
              creatureId={id}
              label="Legendary actions per round"
              field="legendaryActionsPerRound"
              value={creature.legendaryActionsPerRound}
              canManage={canManage}
              nullable
            />
          </Line>
          <ToggleField
            creatureId={id}
            label="Has a lair"
            field="hasLair"
            value={creature.hasLair}
            canManage={canManage}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Line label="Type tags">
            <ListField
              creatureId={id}
              label="Type tags"
              field="typeTags"
              value={creature.typeTags}
              canManage={canManage}
            />
          </Line>
          {isMonster ? (
            <>
              <Line label="Environment">
                <ListField
                  creatureId={id}
                  label="Environment"
                  field="environment"
                  value={creature.environment}
                  canManage={canManage}
                />
              </Line>
              <Line label="Source">
                <TextField
                  creatureId={id}
                  label="Source"
                  field="source"
                  value={creature.source}
                  canManage={canManage}
                />
              </Line>
            </>
          ) : (
            <>
              <Line label="Race">
                <TextField
                  creatureId={id}
                  label="Race"
                  field="race"
                  value={creature.race}
                  canManage={canManage}
                />
              </Line>
              <Line label="Occupation">
                <TextField
                  creatureId={id}
                  label="Occupation"
                  field="occupation"
                  value={creature.occupation}
                  canManage={canManage}
                />
              </Line>
              <Line label="Faction">
                <TextField
                  creatureId={id}
                  label="Faction"
                  field="faction"
                  value={creature.faction}
                  canManage={canManage}
                />
              </Line>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Header + description ---------------------------------------------------

// The name is editable here, unlike the character sheet's — the creature API
// accepts `name` on PATCH.
export function CreatureName({
  creature,
  canManage,
}: {
  creature: CreatureStatBlock;
  canManage: boolean;
}) {
  const state = useOptimisticField(creature.name, (next) =>
    patchCreature(creature.id, { name: next }),
  );
  if (!canManage) {
    return <>{creature.name}</>;
  }
  return (
    <EditableText
      label="Name"
      value={state.value}
      onCommit={(next) => {
        if (next === null) {
          toast.error("Name is required.");
          return;
        }
        state.set(next);
      }}
      pending={state.pending}
      className="font-heading text-lg font-medium"
    />
  );
}

export function DescriptionSection({
  creature,
  canManage,
}: {
  creature: CreatureStatBlock;
  canManage: boolean;
}) {
  if (!canManage && !creature.description) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Description</CardTitle>
      </CardHeader>
      <CardContent>
        <TextField
          creatureId={creature.id}
          label="description"
          field="description"
          value={creature.description}
          canManage={canManage}
          multiline
        />
      </CardContent>
    </Card>
  );
}
