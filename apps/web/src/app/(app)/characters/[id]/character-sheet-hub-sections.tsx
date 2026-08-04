"use client";

import type { Ability, CharacterSheet, DerivedStats } from "@dnd/shared";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOptimisticField } from "@/hooks/use-optimistic-field";
import { cn, formatModifier } from "@/lib/utils";
import {
  EditableNumber,
  EditableText,
  EditableToggle,
  TickBoxes,
} from "@/components/editable-fields";
import { patchCharacter } from "./character-sheet-mutations";

// The interactive half of the character sheet: every non-calculated scalar on
// the main PlayerCharacter row, edited in place. Derived values (initiative, the
// passives, ability modifiers, save totals) are rendered here too but stay
// read-only — the API recomputes them from the scalars on every read.
//
// PATCH /characters/:id is partial, so each field owns its own
// useOptimisticField instance and sends only itself. That also means writes are
// serialized per field, which is the granularity that matters.

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

const ABILITY_MIN = 1;
const ABILITY_MAX = 30;
const DEATH_SAVE_MAX = 3;

// --- Small wrappers ---------------------------------------------------------

// A read-only bordered tile — the derived numbers.
function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

// A non-interactive version of TickBoxes for viewers who can't write — same
// visual, no click handlers.
function ReadOnlyTicks({
  count,
  filled,
  fillClass = "bg-primary border-primary",
}: {
  count: number;
  filled: number;
  fillClass?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={cn(
            "size-5 rounded-[4px] border",
            index < filled ? fillClass : "bg-transparent",
          )}
        />
      ))}
    </div>
  );
}

// The editable counterpart: same tile, but the value is one inline editor bound
// to one column on the character row.
function EditableStat({
  characterId,
  label,
  field,
  value,
  min = 0,
  max,
  canManage,
}: {
  characterId: string;
  label: string;
  field: string;
  value: number;
  min?: number;
  max?: number;
  canManage: boolean;
}) {
  const state = useOptimisticField(value, (next) =>
    patchCharacter(characterId, { [field]: next }),
  );
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-lg font-semibold">
        {canManage ? (
          <EditableNumber
            label={label}
            value={state.value}
            onCommit={(next) => next !== null && state.set(next)}
            pending={state.pending}
            min={min}
            max={max}
          />
        ) : (
          value
        )}
      </p>
    </div>
  );
}

// Armor Class is computed (see derived.armorClass) from equipped armor/
// shield + Dex, so the headline number stays read-only; a small nullable
// override underneath sets the fallback used when nothing is equipped
// (natural armor, homebrew, or any AC the equipment formula can't express).
function ArmorClassStat({
  characterId,
  armorClass,
  baseArmorClass,
  canManage,
}: {
  characterId: string;
  armorClass: number;
  baseArmorClass: number | null;
  canManage: boolean;
}) {
  const base = useOptimisticField(baseArmorClass, (next) =>
    patchCharacter(characterId, { baseArmorClass: next }),
  );
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-muted-foreground text-xs">Armor Class</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{armorClass}</p>
      <p className="text-muted-foreground mt-1 text-xs">
        base{" "}
        {canManage ? (
          <EditableNumber
            label="Base armor class (natural armor / unarmored override)"
            value={base.value}
            onCommit={base.set}
            pending={base.pending}
            nullable
            render={(v) => (v === null ? "auto" : String(v))}
          />
        ) : (
          (base.value ?? "auto")
        )}
      </p>
    </div>
  );
}

// An inline number in a running line of text ("Fly 30 ft."), clearable when the
// column is nullable.
function InlineNumber({
  characterId,
  label,
  field,
  value,
  suffix = "ft.",
  nullable = true,
  canManage,
}: {
  characterId: string;
  label: string;
  field: string;
  value: number | null;
  suffix?: string;
  nullable?: boolean;
  canManage: boolean;
}) {
  const state = useOptimisticField(value, (next) =>
    patchCharacter(characterId, { [field]: next }),
  );
  const render = (v: number | null) => (v === null ? "—" : `${v} ${suffix}`);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-muted-foreground">{label}</span>
      {canManage ? (
        <EditableNumber
          label={label}
          value={state.value}
          onCommit={state.set}
          pending={state.pending}
          nullable={nullable}
          render={render}
        />
      ) : (
        render(value)
      )}
    </span>
  );
}

function InlineText({
  characterId,
  label,
  field,
  value,
  multiline = true,
  canManage,
}: {
  characterId: string;
  label: string;
  field: string;
  value: string | null;
  multiline?: boolean;
  canManage: boolean;
}) {
  const state = useOptimisticField(value, (next) =>
    patchCharacter(characterId, { [field]: next }),
  );
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      {canManage ? (
        <EditableText
          label={label}
          value={state.value}
          onCommit={state.set}
          pending={state.pending}
          multiline={multiline}
          className="text-sm"
        />
      ) : (
        <p
          className={
            value
              ? "text-sm whitespace-pre-wrap"
              : "text-muted-foreground text-sm italic"
          }
        >
          {value ?? `No ${label.toLowerCase()}.`}
        </p>
      )}
    </div>
  );
}

function ToggleField({
  characterId,
  label,
  field,
  value,
  canManage,
}: {
  characterId: string;
  label: string;
  field: string;
  value: boolean;
  canManage: boolean;
}) {
  const state = useOptimisticField(value, (next) =>
    patchCharacter(characterId, { [field]: next }),
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

// --- Header badges ----------------------------------------------------------

export function ProgressBadges({
  characterId,
  inspiration,
  experiencePoints,
  canManage,
}: {
  characterId: string;
  inspiration: boolean;
  experiencePoints: number;
  canManage: boolean;
}) {
  const inspired = useOptimisticField(inspiration, (next) =>
    patchCharacter(characterId, { inspiration: next }),
  );
  const xp = useOptimisticField(experiencePoints, (next) =>
    patchCharacter(characterId, { experiencePoints: next }),
  );

  if (!canManage) {
    return (
      <>
        <Badge variant="secondary">XP {xp.value}</Badge>
        <Badge variant={inspired.value ? "default" : "secondary"}>
          {inspired.value ? "Inspired" : "No inspiration"}
        </Badge>
      </>
    );
  }

  return (
    <>
      <Badge variant="secondary" render={<span />}>
        XP{" "}
        <EditableNumber
          label="Experience points"
          value={xp.value}
          onCommit={(next) => next !== null && xp.set(next)}
          pending={xp.pending}
          inputClassName="w-20"
        />
      </Badge>
      <button
        type="button"
        aria-pressed={inspired.value}
        aria-busy={inspired.pending || undefined}
        onClick={() => inspired.set(!inspired.value)}
        className={cn(
          "focus-visible:ring-ring/50 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none aria-busy:opacity-60",
          inspired.value
            ? "bg-primary text-primary-foreground border-transparent"
            : "text-muted-foreground hover:bg-muted/60",
        )}
      >
        {inspired.value ? "Inspired" : "No inspiration"}
      </button>
    </>
  );
}

// --- Combat -----------------------------------------------------------------

export function CombatSection({
  characterId,
  sheet,
  derived,
  canManage,
}: {
  characterId: string;
  sheet: CharacterSheet;
  derived: DerivedStats;
  canManage: boolean;
}) {
  const currentHp = useOptimisticField(sheet.currentHitPoints, (next) =>
    patchCharacter(characterId, { currentHitPoints: next }),
  );
  const successes = useOptimisticField(sheet.deathSaveSuccesses, (next) =>
    patchCharacter(characterId, { deathSaveSuccesses: next }),
  );
  const failures = useOptimisticField(sheet.deathSaveFailures, (next) =>
    patchCharacter(characterId, { deathSaveFailures: next }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Combat</CardTitle>
        <CardDescription>
          Click any value to edit it; initiative and the passive scores are
          computed.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-muted-foreground text-xs">Hit Points</p>
            <p className="mt-1 text-lg font-semibold">
              {canManage ? (
                <EditableNumber
                  label="Current hit points"
                  value={currentHp.value}
                  onCommit={(next) => next !== null && currentHp.set(next)}
                  pending={currentHp.pending}
                  // The API only floors PATCH at 0; the create path caps current
                  // HP at max + temp, so hold that same rule here.
                  max={sheet.maxHitPoints + sheet.temporaryHitPoints}
                />
              ) : (
                currentHp.value
              )}
              <span className="text-muted-foreground">/</span>
              <EditableNumberField
                characterId={characterId}
                label="Maximum hit points"
                field="maxHitPoints"
                value={sheet.maxHitPoints}
                canManage={canManage}
              />
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              temp{" "}
              <EditableNumberField
                characterId={characterId}
                label="Temporary hit points"
                field="temporaryHitPoints"
                value={sheet.temporaryHitPoints}
                canManage={canManage}
              />{" "}
              · max mod{" "}
              <EditableNumberField
                characterId={characterId}
                label="Hit point max modifier"
                field="hitPointMaxModifier"
                value={sheet.hitPointMaxModifier}
                min={undefined}
                canManage={canManage}
              />
            </p>
          </div>
          <ArmorClassStat
            characterId={characterId}
            armorClass={derived.armorClass}
            baseArmorClass={sheet.baseArmorClass}
            canManage={canManage}
          />
          <Stat label="Initiative" value={formatModifier(derived.initiative)} />
          <EditableStat
            characterId={characterId}
            label="Speed"
            field="speed"
            value={sheet.speed}
            canManage={canManage}
          />
          <Stat label="Passive Perception" value={derived.passivePerception} />
          <Stat
            label="Passive Investigation"
            value={derived.passiveInvestigation}
          />
          <Stat label="Passive Insight" value={derived.passiveInsight} />
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-center text-xs">
              Death Saves
            </p>
            <div className="mt-2 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-16 text-xs">
                  Successes
                </span>
                {canManage ? (
                  <TickBoxes
                    count={DEATH_SAVE_MAX}
                    filled={successes.value}
                    onSet={successes.set}
                    pending={successes.pending}
                    groupLabel={`Death save successes, ${successes.value} of ${DEATH_SAVE_MAX}`}
                    boxLabel={(index) => `Death save success ${index + 1}`}
                  />
                ) : (
                  <ReadOnlyTicks
                    count={DEATH_SAVE_MAX}
                    filled={successes.value}
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-16 text-xs">
                  Failures
                </span>
                {canManage ? (
                  <TickBoxes
                    count={DEATH_SAVE_MAX}
                    filled={failures.value}
                    onSet={failures.set}
                    pending={failures.pending}
                    groupLabel={`Death save failures, ${failures.value} of ${DEATH_SAVE_MAX}`}
                    boxLabel={(index) => `Death save failure ${index + 1}`}
                    fillClass="bg-destructive border-destructive"
                  />
                ) : (
                  <ReadOnlyTicks
                    count={DEATH_SAVE_MAX}
                    filled={failures.value}
                    fillClass="bg-destructive border-destructive"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Always rendered, even when every value is null — otherwise there is
            no way to add a fly speed to a character that has none. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <InlineNumber
            characterId={characterId}
            label="Fly"
            field="flySpeed"
            value={sheet.flySpeed}
            canManage={canManage}
          />
          <InlineNumber
            characterId={characterId}
            label="Swim"
            field="swimSpeed"
            value={sheet.swimSpeed}
            canManage={canManage}
          />
          <InlineNumber
            characterId={characterId}
            label="Climb"
            field="climbSpeed"
            value={sheet.climbSpeed}
            canManage={canManage}
          />
          <InlineNumber
            characterId={characterId}
            label="Darkvision"
            field="darkvision"
            value={sheet.darkvision}
            canManage={canManage}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// A bare inline number bound to one column — used inside composed lines where
// EditableStat's tile would be too much chrome.
function EditableNumberField({
  characterId,
  label,
  field,
  value,
  min = 0,
  max,
  canManage,
}: {
  characterId: string;
  label: string;
  field: string;
  value: number;
  min?: number;
  max?: number;
  canManage: boolean;
}) {
  const state = useOptimisticField(value, (next) =>
    patchCharacter(characterId, { [field]: next }),
  );
  if (!canManage) return <>{value}</>;
  return (
    <EditableNumber
      label={label}
      value={state.value}
      onCommit={(next) => next !== null && state.set(next)}
      pending={state.pending}
      min={min}
      max={max}
    />
  );
}

// --- Abilities & saves ------------------------------------------------------

export function AbilitiesSection({
  characterId,
  sheet,
  derived,
  canManage,
}: {
  characterId: string;
  sheet: CharacterSheet;
  derived: DerivedStats;
  canManage: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ability Scores &amp; Saving Throws</CardTitle>
        <CardDescription>
          Scores are stored post-racial/ASI; modifiers and save totals are
          computed.
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
                <EditableNumberField
                  characterId={characterId}
                  label={ability.label}
                  field={ability.score}
                  value={sheet[ability.score]}
                  min={ABILITY_MIN}
                  max={ABILITY_MAX}
                  canManage={canManage}
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
                  characterId={characterId}
                  label="Proficient"
                  field={ability.save}
                  value={sheet[ability.save]}
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

// --- Coin -------------------------------------------------------------------

const COINS: {
  label: string;
  field: keyof Pick<
    CharacterSheet,
    "platinum" | "gold" | "electrum" | "silver" | "copper"
  >;
}[] = [
  { label: "PP", field: "platinum" },
  { label: "GP", field: "gold" },
  { label: "EP", field: "electrum" },
  { label: "SP", field: "silver" },
  { label: "CP", field: "copper" },
];

export function CoinSection({
  characterId,
  sheet,
  canManage,
}: {
  characterId: string;
  sheet: CharacterSheet;
  canManage: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Coin</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2 text-center text-sm">
          {COINS.map((coin) => (
            <div key={coin.field} className="rounded-md border p-2">
              <p className="text-muted-foreground text-xs">{coin.label}</p>
              <p className="font-semibold">
                <EditableNumberField
                  characterId={characterId}
                  label={coin.label}
                  field={coin.field}
                  value={sheet[coin.field]}
                  canManage={canManage}
                />
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Roleplay ---------------------------------------------------------------

export function RoleplaySection({
  characterId,
  sheet,
  canManage,
}: {
  characterId: string;
  sheet: CharacterSheet;
  canManage: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Roleplay</CardTitle>
        <CardDescription>
          Personality, ideals, bonds, and flaws. Click a box to write in it;
          emptying one clears it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <InlineText
          characterId={characterId}
          label="Background"
          field="background"
          value={sheet.background}
          multiline={false}
          canManage={canManage}
        />
        <InlineText
          characterId={characterId}
          label="Description"
          field="description"
          value={sheet.description}
          canManage={canManage}
        />
        <InlineText
          characterId={characterId}
          label="Personality Traits"
          field="traits"
          value={sheet.traits}
          canManage={canManage}
        />
        <InlineText
          characterId={characterId}
          label="Ideals"
          field="ideals"
          value={sheet.ideals}
          canManage={canManage}
        />
        <InlineText
          characterId={characterId}
          label="Bonds"
          field="bonds"
          value={sheet.bonds}
          canManage={canManage}
        />
        <InlineText
          characterId={characterId}
          label="Flaws"
          field="flaws"
          value={sheet.flaws}
          canManage={canManage}
        />
      </CardContent>
    </Card>
  );
}
