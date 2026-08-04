"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { toast } from "sonner";
import type {
  Ability,
  Alignment,
  CreateCreatureInput,
  CreatureKind,
  CreatureSize,
  CreatureType,
} from "@dnd/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { EnumSelect, Field } from "@/components/form-fields";
import {
  ALIGNMENTS,
  CREATURE_KINDS,
  CREATURE_SIZES,
  CREATURE_TYPES,
  formatChallengeRating,
  parseChallengeRating,
} from "@/lib/creature-labels";
import { cn } from "@/lib/utils";

// Creation wizard for a Creature — NPCs and monsters share one stat block, so
// one wizard covers both and the kind only swaps a few flavour fields. Like the
// character wizard it captures ONLY the main row; traits, actions, skills,
// damage modifiers and placements are added afterwards from the stat block.

// --- Reference data --------------------------------------------------------

const ABILITIES: { key: Ability; label: string; field: AbilityField }[] = [
  { key: "STR", label: "Strength", field: "strength" },
  { key: "DEX", label: "Dexterity", field: "dexterity" },
  { key: "CON", label: "Constitution", field: "constitution" },
  { key: "INT", label: "Intelligence", field: "intelligence" },
  { key: "WIS", label: "Wisdom", field: "wisdom" },
  { key: "CHA", label: "Charisma", field: "charisma" },
];

type AbilityField =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

const SAVE_FIELD: Record<AbilityField, SaveField> = {
  strength: "strengthSaveProf",
  dexterity: "dexteritySaveProf",
  constitution: "constitutionSaveProf",
  intelligence: "intelligenceSaveProf",
  wisdom: "wisdomSaveProf",
  charisma: "charismaSaveProf",
};

type SaveField =
  | "strengthSaveProf"
  | "dexteritySaveProf"
  | "constitutionSaveProf"
  | "intelligenceSaveProf"
  | "wisdomSaveProf"
  | "charismaSaveProf";

const STEPS = [
  "Identity",
  "Abilities",
  "Defense",
  "Senses & Challenge",
  "Review",
];

// --- Local form state ------------------------------------------------------

// Every numeric field is held as raw input text and parsed on submit, so a
// half-typed value never fights the input.
interface FormState {
  kind: CreatureKind;
  scope: "campaign" | "shared";
  name: string;
  description: string;
  size: CreatureSize;
  creatureType: string; // "NONE" | CreatureType
  typeTags: string; // comma separated
  alignment: string; // "NONE" | Alignment
  alignmentNote: string;

  occupation: string;
  faction: string;
  race: string;
  source: string;

  scores: Record<AbilityField, string>;
  saves: Record<SaveField, boolean>;

  baseArmorClass: string;
  armorClassNote: string;
  hitPoints: string;
  hitDice: string;

  speed: string;
  flySpeed: string;
  swimSpeed: string;
  climbSpeed: string;
  burrowSpeed: string;
  hover: boolean;

  darkvision: string;
  blindsight: string;
  blindBeyond: boolean;
  tremorsense: string;
  truesight: string;
  languages: string;
  conditionImmunities: string; // comma separated

  challengeRating: string; // accepts 1/8, 1/4, 1/2 or a plain number
  experiencePoints: string;
  legendaryActionsPerRound: string;
  hasLair: boolean;
  environment: string; // comma separated
}

function initialForm(scope: "campaign" | "shared"): FormState {
  return {
    kind: "NPC",
    scope,
    name: "",
    description: "",
    size: "MEDIUM",
    creatureType: "NONE",
    typeTags: "",
    alignment: "NONE",
    alignmentNote: "",
    occupation: "",
    faction: "",
    race: "",
    source: "",
    scores: {
      strength: "10",
      dexterity: "10",
      constitution: "10",
      intelligence: "10",
      wisdom: "10",
      charisma: "10",
    },
    saves: {
      strengthSaveProf: false,
      dexteritySaveProf: false,
      constitutionSaveProf: false,
      intelligenceSaveProf: false,
      wisdomSaveProf: false,
      charismaSaveProf: false,
    },
    baseArmorClass: "",
    armorClassNote: "",
    hitPoints: "",
    hitDice: "",
    speed: "30",
    flySpeed: "",
    swimSpeed: "",
    climbSpeed: "",
    burrowSpeed: "",
    hover: false,
    darkvision: "",
    blindsight: "",
    blindBeyond: false,
    tremorsense: "",
    truesight: "",
    languages: "",
    conditionImmunities: "",
    challengeRating: "",
    experiencePoints: "",
    legendaryActionsPerRound: "",
    hasLair: false,
    environment: "",
  };
}

// --- Helpers ---------------------------------------------------------------

function modifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function fmt(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

function optNum(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function optText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function list(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

// Every optional number is "blank = leave unset", so a bad non-empty value is
// the only failure worth reporting.
function checkOptionalCount(
  value: string,
  label: string,
  { integer = true }: { integer?: boolean } = {},
): string | null {
  if (value.trim() === "") return null;
  const n = optNum(value);
  if (n === undefined || n < 0) return `${label} must be 0 or more.`;
  if (integer && !Number.isInteger(n)) {
    return `${label} must be a whole number.`;
  }
  return null;
}

// --- Component -------------------------------------------------------------

export function CreatureWizard({
  campaignId,
  campaignName,
  canManageCampaign,
  canManageShared,
}: {
  campaignId: string;
  campaignName: string;
  canManageCampaign: boolean;
  canManageShared: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() =>
    initialForm(canManageCampaign ? "campaign" : "shared"),
  );
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setScore = (field: AbilityField, value: string) =>
    setForm((f) => ({ ...f, scores: { ...f.scores, [field]: value } }));

  const toggleSave = (field: SaveField) =>
    setForm((f) => ({ ...f, saves: { ...f.saves, [field]: !f.saves[field] } }));

  // Per-step validation. Returns an error string, or null when the step is OK.
  function validateStep(current: number): string | null {
    if (current === 0 && !form.name.trim()) {
      return "Give the creature a name.";
    }
    if (current === 1) {
      for (const a of ABILITIES) {
        const v = optNum(form.scores[a.field]);
        if (v === undefined || !Number.isInteger(v) || v < 1 || v > 30) {
          return `${a.label} must be a whole number between 1 and 30.`;
        }
      }
    }
    if (current === 2) {
      if (form.baseArmorClass.trim()) {
        const ac = optNum(form.baseArmorClass);
        if (ac === undefined || !Number.isInteger(ac) || ac < 0) {
          return "Base armor class must be a whole number, 0 or more.";
        }
      }
      const hp = optNum(form.hitPoints);
      if (hp === undefined || !Number.isInteger(hp) || hp < 0) {
        return "Enter hit points (a whole number, 0 or more).";
      }
      for (const [value, label] of [
        [form.speed, "Speed"],
        [form.flySpeed, "Fly speed"],
        [form.swimSpeed, "Swim speed"],
        [form.climbSpeed, "Climb speed"],
        [form.burrowSpeed, "Burrow speed"],
      ] as const) {
        const error = checkOptionalCount(value, label);
        if (error) return error;
      }
    }
    if (current === 3) {
      for (const [value, label] of [
        [form.darkvision, "Darkvision"],
        [form.blindsight, "Blindsight"],
        [form.tremorsense, "Tremorsense"],
        [form.truesight, "Truesight"],
        [form.experiencePoints, "Experience points"],
        [form.legendaryActionsPerRound, "Legendary actions"],
      ] as const) {
        const error = checkOptionalCount(value, label);
        if (error) return error;
      }
      if (form.challengeRating.trim() !== "") {
        const cr = parseChallengeRating(form.challengeRating);
        if (cr === undefined || cr < 0) {
          return "Challenge rating must be a number (1/8, 1/4, 1/2, 5…).";
        }
      }
    }
    return null;
  }

  function next() {
    const error = validateStep(step);
    if (error) {
      toast.error(error);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function buildPayload(): CreateCreatureInput {
    const isMonster = form.kind === "MONSTER";
    const typeTags = list(form.typeTags);
    const conditionImmunities = list(form.conditionImmunities);
    const environment = list(form.environment);

    return {
      kind: form.kind,
      name: form.name.trim(),
      description: optText(form.description) ?? null,
      // null = a shared-bestiary creature any DM may edit.
      campaignId: form.scope === "campaign" ? campaignId : null,

      size: form.size,
      creatureType:
        form.creatureType === "NONE"
          ? null
          : (form.creatureType as CreatureType),
      ...(typeTags.length ? { typeTags } : {}),
      alignment:
        form.alignment === "NONE" ? null : (form.alignment as Alignment),
      alignmentNote: optText(form.alignmentNote) ?? null,

      baseArmorClass: optNum(form.baseArmorClass) ?? null,
      armorClassNote: optText(form.armorClassNote) ?? null,
      hitPoints: optNum(form.hitPoints) ?? 0,
      hitDice: optText(form.hitDice) ?? null,

      speed: optNum(form.speed) ?? 30,
      flySpeed: optNum(form.flySpeed) ?? null,
      swimSpeed: optNum(form.swimSpeed) ?? null,
      climbSpeed: optNum(form.climbSpeed) ?? null,
      burrowSpeed: optNum(form.burrowSpeed) ?? null,
      hover: form.hover,

      strength: Number(form.scores.strength),
      dexterity: Number(form.scores.dexterity),
      constitution: Number(form.scores.constitution),
      intelligence: Number(form.scores.intelligence),
      wisdom: Number(form.scores.wisdom),
      charisma: Number(form.scores.charisma),
      ...form.saves,

      darkvision: optNum(form.darkvision) ?? null,
      blindsight: optNum(form.blindsight) ?? null,
      blindBeyond: form.blindBeyond,
      tremorsense: optNum(form.tremorsense) ?? null,
      truesight: optNum(form.truesight) ?? null,
      languages: optText(form.languages) ?? null,
      ...(conditionImmunities.length ? { conditionImmunities } : {}),

      challengeRating: parseChallengeRating(form.challengeRating) ?? null,
      experiencePoints: optNum(form.experiencePoints) ?? null,
      legendaryActionsPerRound: optNum(form.legendaryActionsPerRound) ?? null,
      hasLair: form.hasLair,
      ...(environment.length ? { environment } : {}),

      // Flavour columns only one kind uses; the other stays null rather than
      // carrying a stale value if the kind was switched mid-wizard.
      source: isMonster ? (optText(form.source) ?? null) : null,
      occupation: isMonster ? null : (optText(form.occupation) ?? null),
      faction: isMonster ? null : (optText(form.faction) ?? null),
      race: isMonster ? null : (optText(form.race) ?? null),
    };
  }

  async function submit() {
    // Re-validate every gated step before the network call.
    for (let s = 0; s <= 3; s++) {
      const error = validateStep(s);
      if (error) {
        toast.error(error);
        setStep(s);
        return;
      }
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/creatures", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Could not create creature");
        return;
      }
      const { id } = (await res.json()) as { id: string };
      toast.success("Creature created");
      router.push(`/campaigns/${campaignId}/creatures/${id}`);
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
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

      <StepBar step={step} onSelect={setStep} />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
          <CardDescription>
            Step {step + 1} of {STEPS.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {step === 0 && (
            <IdentityStep
              form={form}
              set={set}
              campaignName={campaignName}
              canManageCampaign={canManageCampaign}
              canManageShared={canManageShared}
            />
          )}
          {step === 1 && (
            <AbilitiesStep
              form={form}
              setScore={setScore}
              toggleSave={toggleSave}
            />
          )}
          {step === 2 && <DefenseStep form={form} set={set} />}
          {step === 3 && <SensesStep form={form} set={set} />}
          {step === 4 && <ReviewStep form={form} campaignName={campaignName} />}

          <Separator />

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={back} disabled={step === 0}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>Next</Button>
            ) : (
              <Button onClick={submit} disabled={submitting}>
                {submitting ? "Creating…" : "Create creature"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-4 text-center text-sm">
        Traits, actions, skills, damage modifiers and locations are added from
        the stat block after you create the creature.
      </p>
    </div>
  );
}

// --- Stepper ---------------------------------------------------------------

function StepBar({
  step,
  onSelect,
}: {
  step: number;
  onSelect: (s: number) => void;
}) {
  return (
    <ol className="flex flex-wrap gap-1.5">
      {STEPS.map((label, i) => (
        <li key={label}>
          <button
            type="button"
            onClick={() => onSelect(i)}
            disabled={i > step}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              i === step
                ? "border-primary bg-primary text-primary-foreground"
                : i < step
                  ? "border-border bg-muted text-foreground hover:bg-muted/70"
                  : "border-border text-muted-foreground",
            )}
          >
            {i + 1}. {label}
          </button>
        </li>
      ))}
    </ol>
  );
}

// --- Shared field helpers --------------------------------------------------

type Setter = <K extends keyof FormState>(key: K, value: FormState[K]) => void;

function NumberField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <Field id={id} label={label}>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Field id={id} label={label}>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="accent-primary size-4"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

// --- Steps -----------------------------------------------------------------

function IdentityStep({
  form,
  set,
  campaignName,
  canManageCampaign,
  canManageShared,
}: {
  form: FormState;
  set: Setter;
  campaignName: string;
  canManageCampaign: boolean;
  canManageShared: boolean;
}) {
  const scopeItems: Record<string, string> = {
    ...(canManageCampaign ? { campaign: campaignName } : {}),
    ...(canManageShared ? { shared: "Shared bestiary" } : {}),
  };
  const typeItems: Record<string, string> = {
    NONE: "Unspecified",
    ...CREATURE_TYPES,
  };
  const alignmentItems: Record<string, string> = {
    NONE: "Unaligned",
    ...ALIGNMENTS,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="kind" label="Kind">
          <EnumSelect
            id="kind"
            value={form.kind}
            onValueChange={(v) => set("kind", v as CreatureKind)}
            items={CREATURE_KINDS}
          />
        </Field>
        <Field id="scope" label="Belongs to">
          <EnumSelect
            id="scope"
            value={form.scope}
            onValueChange={(v) => set("scope", v as FormState["scope"])}
            items={scopeItems}
          />
        </Field>
        <TextField
          id="name"
          label="Name"
          value={form.name}
          onChange={(v) => set("name", v)}
          placeholder="Goblin Boss, Sister Garaele…"
        />
        <Field id="size" label="Size">
          <EnumSelect
            id="size"
            value={form.size}
            onValueChange={(v) => set("size", v as CreatureSize)}
            items={CREATURE_SIZES}
          />
        </Field>
        <Field id="creatureType" label="Type">
          <EnumSelect
            id="creatureType"
            value={form.creatureType}
            onValueChange={(v) => set("creatureType", v)}
            items={typeItems}
          />
        </Field>
        <TextField
          id="typeTags"
          label="Type tags (comma separated)"
          value={form.typeTags}
          onChange={(v) => set("typeTags", v)}
          placeholder="goblinoid, shapechanger"
        />
        <Field id="alignment" label="Alignment">
          <EnumSelect
            id="alignment"
            value={form.alignment}
            onValueChange={(v) => set("alignment", v)}
            items={alignmentItems}
          />
        </Field>
        <TextField
          id="alignmentNote"
          label="Alignment note"
          value={form.alignmentNote}
          onChange={(v) => set("alignmentNote", v)}
          placeholder="any non-good alignment"
        />
      </div>

      {form.kind === "NPC" ? (
        <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
          <legend className="px-1 text-sm font-medium">NPC details</legend>
          <TextField
            id="race"
            label="Race"
            value={form.race}
            onChange={(v) => set("race", v)}
            placeholder="Half-elf"
          />
          <TextField
            id="occupation"
            label="Occupation"
            value={form.occupation}
            onChange={(v) => set("occupation", v)}
            placeholder="Innkeeper"
          />
          <TextField
            id="faction"
            label="Faction"
            value={form.faction}
            onChange={(v) => set("faction", v)}
            placeholder="Harpers"
          />
        </fieldset>
      ) : (
        <fieldset className="grid gap-4 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">Monster details</legend>
          <TextField
            id="source"
            label="Source"
            value={form.source}
            onChange={(v) => set("source", v)}
            placeholder="Monster Manual, homebrew…"
          />
        </fieldset>
      )}

      <Field id="description" label="Description">
        <Textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What the party sees first."
        />
      </Field>
    </div>
  );
}

function AbilitiesStep({
  form,
  setScore,
  toggleSave,
}: {
  form: FormState;
  setScore: (field: AbilityField, value: string) => void;
  toggleSave: (field: SaveField) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Enter final scores (1–30). Check the box for saving-throw proficiency —
        the bonus itself comes from the challenge rating and is calculated for
        you.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {ABILITIES.map((a) => {
          const raw = Number(form.scores[a.field]);
          const mod = Number.isFinite(raw) ? modifier(raw) : 0;
          const saveField = SAVE_FIELD[a.field];
          return (
            <div key={a.key} className="rounded-lg border p-3">
              <Label htmlFor={`score-${a.field}`}>{a.label}</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  id={`score-${a.field}`}
                  type="number"
                  min={1}
                  max={30}
                  value={form.scores[a.field]}
                  onChange={(e) => setScore(a.field, e.target.value)}
                  className="w-20"
                />
                <span className="text-muted-foreground text-sm tabular-nums">
                  {Number.isFinite(raw) ? fmt(mod) : "—"}
                </span>
              </div>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-primary size-4"
                  checked={form.saves[saveField]}
                  onChange={() => toggleSave(saveField)}
                />
                Save proficiency
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DefenseStep({ form, set }: { form: FormState; set: Setter }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="baseArmorClass"
          label="Base armor class"
          value={form.baseArmorClass}
          onChange={(v) => set("baseArmorClass", v)}
          placeholder="auto: 10 + Dex"
        />
        <TextField
          id="armorClassNote"
          label="AC note"
          value={form.armorClassNote}
          onChange={(v) => set("armorClassNote", v)}
          placeholder="natural armor, 16 with mage armor…"
        />
        <NumberField
          id="hitPoints"
          label="Hit points"
          value={form.hitPoints}
          onChange={(v) => set("hitPoints", v)}
          placeholder="Average total"
        />
        <TextField
          id="hitDice"
          label="Hit dice"
          value={form.hitDice}
          onChange={(v) => set("hitDice", v)}
          placeholder="7d8 + 14"
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">
          Movement in feet. Leave a mode blank if the creature doesn&apos;t have
          it.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            id="speed"
            label="Speed"
            value={form.speed}
            onChange={(v) => set("speed", v)}
          />
          <NumberField
            id="flySpeed"
            label="Fly"
            value={form.flySpeed}
            onChange={(v) => set("flySpeed", v)}
          />
          <NumberField
            id="swimSpeed"
            label="Swim"
            value={form.swimSpeed}
            onChange={(v) => set("swimSpeed", v)}
          />
          <NumberField
            id="climbSpeed"
            label="Climb"
            value={form.climbSpeed}
            onChange={(v) => set("climbSpeed", v)}
          />
          <NumberField
            id="burrowSpeed"
            label="Burrow"
            value={form.burrowSpeed}
            onChange={(v) => set("burrowSpeed", v)}
          />
          <div className="flex items-end pb-2">
            <Checkbox
              label="Can hover"
              checked={form.hover}
              onChange={(v) => set("hover", v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SensesStep({ form, set }: { form: FormState; set: Setter }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">
          Sense ranges in feet. Passive Perception is calculated from Wisdom and
          the creature&apos;s skills.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="darkvision"
            label="Darkvision"
            value={form.darkvision}
            onChange={(v) => set("darkvision", v)}
          />
          <NumberField
            id="blindsight"
            label="Blindsight"
            value={form.blindsight}
            onChange={(v) => set("blindsight", v)}
          />
          <NumberField
            id="tremorsense"
            label="Tremorsense"
            value={form.tremorsense}
            onChange={(v) => set("tremorsense", v)}
          />
          <NumberField
            id="truesight"
            label="Truesight"
            value={form.truesight}
            onChange={(v) => set("truesight", v)}
          />
          <TextField
            id="languages"
            label="Languages"
            value={form.languages}
            onChange={(v) => set("languages", v)}
            placeholder="Common, Draconic"
          />
          <TextField
            id="conditionImmunities"
            label="Condition immunities (comma separated)"
            value={form.conditionImmunities}
            onChange={(v) => set("conditionImmunities", v)}
            placeholder="charmed, frightened"
          />
        </div>
        <Checkbox
          label="Blind beyond this radius"
          checked={form.blindBeyond}
          onChange={(v) => set("blindBeyond", v)}
        />
      </div>

      <fieldset className="flex flex-col gap-4 rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">Challenge</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="challengeRating"
            label="Challenge rating"
            value={form.challengeRating}
            onChange={(v) => set("challengeRating", v)}
            placeholder="1/4, 5, 24…"
          />
          <NumberField
            id="experiencePoints"
            label="Experience points"
            value={form.experiencePoints}
            onChange={(v) => set("experiencePoints", v)}
          />
          <NumberField
            id="legendaryActionsPerRound"
            label="Legendary actions per round"
            value={form.legendaryActionsPerRound}
            onChange={(v) => set("legendaryActionsPerRound", v)}
          />
          <TextField
            id="environment"
            label="Environment (comma separated)"
            value={form.environment}
            onChange={(v) => set("environment", v)}
            placeholder="forest, hill"
          />
        </div>
        <Checkbox
          label="Has a lair (lair actions and regional effects)"
          checked={form.hasLair}
          onChange={(v) => set("hasLair", v)}
        />
      </fieldset>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function ReviewStep({
  form,
  campaignName,
}: {
  form: FormState;
  campaignName: string;
}) {
  const savingThrows = ABILITIES.filter((a) => form.saves[SAVE_FIELD[a.field]])
    .map((a) => a.key)
    .join(", ");
  const speeds = [
    `${form.speed || 0} ft.`,
    ...(form.flySpeed ? [`fly ${form.flySpeed} ft.`] : []),
    ...(form.swimSpeed ? [`swim ${form.swimSpeed} ft.`] : []),
    ...(form.climbSpeed ? [`climb ${form.climbSpeed} ft.`] : []),
    ...(form.burrowSpeed ? [`burrow ${form.burrowSpeed} ft.`] : []),
  ].join(", ");
  const cr = parseChallengeRating(form.challengeRating);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 divide-y">
        <ReviewRow label="Name" value={form.name || "—"} />
        <ReviewRow label="Kind" value={CREATURE_KINDS[form.kind]} />
        <ReviewRow
          label="Belongs to"
          value={form.scope === "campaign" ? campaignName : "Shared bestiary"}
        />
        <ReviewRow
          label="Type"
          value={
            form.creatureType === "NONE"
              ? "Unspecified"
              : CREATURE_TYPES[form.creatureType as CreatureType]
          }
        />
        <ReviewRow label="Size" value={CREATURE_SIZES[form.size]} />
        <ReviewRow
          label="Alignment"
          value={
            form.alignmentNote.trim() ||
            (form.alignment === "NONE"
              ? "Unaligned"
              : ALIGNMENTS[form.alignment as Alignment])
          }
        />
        <ReviewRow
          label="Defense"
          value={`Base AC ${form.baseArmorClass || "auto"} · ${
            form.hitPoints || 0
          } HP`}
        />
        <ReviewRow label="Speed" value={speeds} />
        <ReviewRow
          label="Ability scores"
          value={ABILITIES.map((a) => `${a.key} ${form.scores[a.field]}`).join(
            " · ",
          )}
        />
        <ReviewRow label="Save proficiencies" value={savingThrows || "None"} />
        <ReviewRow
          label="Challenge"
          value={formatChallengeRating(cr ?? null)}
        />
      </div>
      <p className="text-muted-foreground text-sm">
        Create the creature to start filling in its traits and actions.
      </p>
    </div>
  );
}
