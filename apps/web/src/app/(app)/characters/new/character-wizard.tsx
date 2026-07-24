"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { toast } from "sonner";
import type {
  Ability,
  Alignment,
  CreateCharacterInput,
  CreatureSize,
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
import { cn } from "@/lib/utils";

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

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

const ALIGNMENTS: Record<Alignment, string> = {
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

const SIZES: Record<CreatureSize, string> = {
  TINY: "Tiny",
  SMALL: "Small",
  MEDIUM: "Medium",
  LARGE: "Large",
  HUGE: "Huge",
  GARGANTUAN: "Gargantuan",
};

// The wizard now captures only the main PlayerCharacter row. Classes, skills,
// spells, feats, items and other satellite-table data are added afterwards from
// the character sheet, each with its own "Add" section.
const STEPS = ["Identity", "Abilities", "Combat", "Roleplay", "Review"];

// --- Local form state ------------------------------------------------------

interface FormState {
  characterName: string;
  race: string;
  subrace: string;
  alignment: string; // "NONE" | Alignment
  size: CreatureSize;
  background: string;
  campaignId: string; // "NONE" | id

  scores: Record<AbilityField, string>;
  saves: Record<SaveField, boolean>;

  maxHitPoints: string;
  currentHitPoints: string;
  temporaryHitPoints: string;
  armorClass: string;
  speed: string;
  flySpeed: string;
  swimSpeed: string;
  climbSpeed: string;
  darkvision: string;

  copper: string;
  silver: string;
  electrum: string;
  gold: string;
  platinum: string;

  description: string;
  traits: string;
  ideals: string;
  bonds: string;
  flaws: string;
}

function initialForm(): FormState {
  return {
    characterName: "",
    race: "",
    subrace: "",
    alignment: "NONE",
    size: "MEDIUM",
    background: "",
    campaignId: "NONE",
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
    maxHitPoints: "",
    currentHitPoints: "",
    temporaryHitPoints: "0",
    armorClass: "10",
    speed: "30",
    flySpeed: "",
    swimSpeed: "",
    climbSpeed: "",
    darkvision: "",
    copper: "0",
    silver: "0",
    electrum: "0",
    gold: "0",
    platinum: "0",
    description: "",
    traits: "",
    ideals: "",
    bonds: "",
    flaws: "",
  };
}

// --- Helpers ---------------------------------------------------------------

function modifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function fmt(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

// Parse a numeric text field; "" -> undefined so optional fields stay unset.
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

// --- Component -------------------------------------------------------------

export function CharacterWizard({
  campaigns,
}: {
  campaigns: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setScore = (field: AbilityField, value: string) =>
    setForm((f) => ({ ...f, scores: { ...f.scores, [field]: value } }));

  const toggleSave = (field: SaveField) =>
    setForm((f) => ({ ...f, saves: { ...f.saves, [field]: !f.saves[field] } }));

  const applyStandardArray = () => {
    setForm((f) => ({
      ...f,
      scores: {
        strength: String(STANDARD_ARRAY[0]),
        dexterity: String(STANDARD_ARRAY[1]),
        constitution: String(STANDARD_ARRAY[2]),
        intelligence: String(STANDARD_ARRAY[3]),
        wisdom: String(STANDARD_ARRAY[4]),
        charisma: String(STANDARD_ARRAY[5]),
      },
    }));
  };

  // Per-step validation. Returns an error string, or null when the step is OK.
  function validateStep(current: number): string | null {
    if (current === 0) {
      if (!form.characterName.trim()) return "Give your character a name.";
      if (!form.race.trim()) return "Enter a race.";
    }
    if (current === 1) {
      for (const a of ABILITIES) {
        const v = optNum(form.scores[a.field]);
        if (v === undefined || v < 1 || v > 30) {
          return `${a.label} must be between 1 and 30.`;
        }
      }
    }
    if (current === 2) {
      const max = optNum(form.maxHitPoints);
      if (max === undefined || max < 0) return "Enter max hit points (≥ 0).";
      const ac = optNum(form.armorClass);
      if (ac === undefined || ac < 0) return "Enter armor class (≥ 0).";
      const temp = optNum(form.temporaryHitPoints) ?? 0;
      const current2 = optNum(form.currentHitPoints);
      if (current2 !== undefined && (current2 < 0 || current2 > max + temp)) {
        return "Current HP must be between 0 and max + temporary HP.";
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

  function buildPayload(): CreateCharacterInput {
    const max = optNum(form.maxHitPoints) ?? 0;
    const current = optNum(form.currentHitPoints) ?? max;

    return {
      characterName: form.characterName.trim(),
      race: form.race.trim(),
      subrace: optText(form.subrace) ?? null,
      alignment:
        form.alignment === "NONE" ? null : (form.alignment as Alignment),
      size: form.size,
      background: optText(form.background) ?? null,
      campaignId: form.campaignId === "NONE" ? null : form.campaignId,

      strength: Number(form.scores.strength),
      dexterity: Number(form.scores.dexterity),
      constitution: Number(form.scores.constitution),
      intelligence: Number(form.scores.intelligence),
      wisdom: Number(form.scores.wisdom),
      charisma: Number(form.scores.charisma),

      ...form.saves,

      maxHitPoints: max,
      currentHitPoints: current,
      temporaryHitPoints: optNum(form.temporaryHitPoints) ?? 0,
      armorClass: optNum(form.armorClass) ?? 10,
      speed: optNum(form.speed) ?? 30,
      flySpeed: optNum(form.flySpeed) ?? null,
      swimSpeed: optNum(form.swimSpeed) ?? null,
      climbSpeed: optNum(form.climbSpeed) ?? null,
      darkvision: optNum(form.darkvision) ?? null,

      copper: optNum(form.copper) ?? 0,
      silver: optNum(form.silver) ?? 0,
      electrum: optNum(form.electrum) ?? 0,
      gold: optNum(form.gold) ?? 0,
      platinum: optNum(form.platinum) ?? 0,

      description: optText(form.description) ?? null,
      traits: optText(form.traits) ?? null,
      ideals: optText(form.ideals) ?? null,
      bonds: optText(form.bonds) ?? null,
      flaws: optText(form.flaws) ?? null,
    };
  }

  async function submit() {
    // Re-validate every gated step before the network call.
    for (let s = 0; s <= 2; s++) {
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
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Could not create character");
        return;
      }
      const { id } = (await res.json()) as { id: string };
      toast.success("Character created");
      router.push(`/characters/${id}`);
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
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

      <Stepper step={step} onSelect={setStep} />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
          <CardDescription>
            Step {step + 1} of {STEPS.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {step === 0 && (
            <IdentityStep form={form} set={set} campaigns={campaigns} />
          )}
          {step === 1 && (
            <AbilitiesStep
              form={form}
              setScore={setScore}
              toggleSave={toggleSave}
              applyStandardArray={applyStandardArray}
            />
          )}
          {step === 2 && <CombatStep form={form} set={set} />}
          {step === 3 && <RoleplayStep form={form} set={set} />}
          {step === 4 && <ReviewStep form={form} campaigns={campaigns} />}

          <Separator />

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={back} disabled={step === 0}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>Next</Button>
            ) : (
              <Button onClick={submit} disabled={submitting}>
                {submitting ? "Creating…" : "Create character"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-4 text-center text-sm">
        Classes, skills, spells, feats, items and more are added from the
        character sheet after you create the character.
      </p>
    </main>
  );
}

// --- Stepper ---------------------------------------------------------------

function Stepper({
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

// --- Steps -----------------------------------------------------------------

function IdentityStep({
  form,
  set,
  campaigns,
}: {
  form: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  campaigns: { id: string; name: string }[];
}) {
  const campaignItems: Record<string, string> = {
    NONE: "Unassigned",
    ...Object.fromEntries(campaigns.map((c) => [c.id, c.name])),
  };
  const alignmentItems: Record<string, string> = {
    NONE: "Unaligned",
    ...ALIGNMENTS,
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="characterName" label="Character name">
        <Input
          id="characterName"
          value={form.characterName}
          onChange={(e) => set("characterName", e.target.value)}
          autoFocus
        />
      </Field>
      <Field id="race" label="Race">
        <Input
          id="race"
          value={form.race}
          onChange={(e) => set("race", e.target.value)}
          placeholder="Elf, Dwarf, Human…"
        />
      </Field>
      <Field id="subrace" label="Subrace (optional)">
        <Input
          id="subrace"
          value={form.subrace}
          onChange={(e) => set("subrace", e.target.value)}
          placeholder="High Elf…"
        />
      </Field>
      <Field id="background" label="Background (optional)">
        <Input
          id="background"
          value={form.background}
          onChange={(e) => set("background", e.target.value)}
          placeholder="Sage, Soldier…"
        />
      </Field>
      <Field id="alignment" label="Alignment">
        <EnumSelect
          id="alignment"
          value={form.alignment}
          onValueChange={(v) => set("alignment", v)}
          items={alignmentItems}
        />
      </Field>
      <Field id="size" label="Size">
        <EnumSelect
          id="size"
          value={form.size}
          onValueChange={(v) => set("size", v as CreatureSize)}
          items={SIZES}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field id="campaign" label="Campaign (optional)">
          <EnumSelect
            id="campaign"
            value={form.campaignId}
            onValueChange={(v) => set("campaignId", v)}
            items={campaignItems}
          />
        </Field>
      </div>
    </div>
  );
}

function AbilitiesStep({
  form,
  setScore,
  toggleSave,
  applyStandardArray,
}: {
  form: FormState;
  setScore: (field: AbilityField, value: string) => void;
  toggleSave: (field: SaveField) => void;
  applyStandardArray: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Enter final scores (1–30). Check the box for saving-throw proficiency.
        </p>
        <Button variant="outline" size="sm" onClick={applyStandardArray}>
          Standard array
        </Button>
      </div>
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
                  className="size-4 accent-primary"
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

function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  placeholder?: string;
}) {
  return (
    <Field id={id} label={label}>
      <Input
        id={id}
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}

function CombatStep({
  form,
  set,
}: {
  form: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField
          id="maxHitPoints"
          label="Max HP"
          min={0}
          value={form.maxHitPoints}
          onChange={(v) => set("maxHitPoints", v)}
        />
        <NumberField
          id="currentHitPoints"
          label="Current HP (defaults to max)"
          min={0}
          value={form.currentHitPoints}
          onChange={(v) => set("currentHitPoints", v)}
        />
        <NumberField
          id="temporaryHitPoints"
          label="Temporary HP"
          min={0}
          value={form.temporaryHitPoints}
          onChange={(v) => set("temporaryHitPoints", v)}
        />
        <NumberField
          id="armorClass"
          label="Armor class"
          min={0}
          value={form.armorClass}
          onChange={(v) => set("armorClass", v)}
        />
      </div>
      <div>
        <p className="mb-3 text-sm font-medium">Movement & senses (feet)</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            id="speed"
            label="Walking speed"
            min={0}
            value={form.speed}
            onChange={(v) => set("speed", v)}
          />
          <NumberField
            id="flySpeed"
            label="Fly speed"
            min={0}
            value={form.flySpeed}
            onChange={(v) => set("flySpeed", v)}
            placeholder="—"
          />
          <NumberField
            id="swimSpeed"
            label="Swim speed"
            min={0}
            value={form.swimSpeed}
            onChange={(v) => set("swimSpeed", v)}
            placeholder="—"
          />
          <NumberField
            id="climbSpeed"
            label="Climb speed"
            min={0}
            value={form.climbSpeed}
            onChange={(v) => set("climbSpeed", v)}
            placeholder="—"
          />
          <NumberField
            id="darkvision"
            label="Darkvision"
            min={0}
            value={form.darkvision}
            onChange={(v) => set("darkvision", v)}
            placeholder="—"
          />
        </div>
      </div>
    </div>
  );
}

function RoleplayStep({
  form,
  set,
}: {
  form: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field id="description" label="Description / appearance">
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="traits" label="Personality traits">
          <Textarea
            id="traits"
            value={form.traits}
            onChange={(e) => set("traits", e.target.value)}
            rows={2}
          />
        </Field>
        <Field id="ideals" label="Ideals">
          <Textarea
            id="ideals"
            value={form.ideals}
            onChange={(e) => set("ideals", e.target.value)}
            rows={2}
          />
        </Field>
        <Field id="bonds" label="Bonds">
          <Textarea
            id="bonds"
            value={form.bonds}
            onChange={(e) => set("bonds", e.target.value)}
            rows={2}
          />
        </Field>
        <Field id="flaws" label="Flaws">
          <Textarea
            id="flaws"
            value={form.flaws}
            onChange={(e) => set("flaws", e.target.value)}
            rows={2}
          />
        </Field>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium">Starting coin</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <NumberField
            id="platinum"
            label="Platinum"
            min={0}
            value={form.platinum}
            onChange={(v) => set("platinum", v)}
          />
          <NumberField
            id="gold"
            label="Gold"
            min={0}
            value={form.gold}
            onChange={(v) => set("gold", v)}
          />
          <NumberField
            id="electrum"
            label="Electrum"
            min={0}
            value={form.electrum}
            onChange={(v) => set("electrum", v)}
          />
          <NumberField
            id="silver"
            label="Silver"
            min={0}
            value={form.silver}
            onChange={(v) => set("silver", v)}
          />
          <NumberField
            id="copper"
            label="Copper"
            min={0}
            value={form.copper}
            onChange={(v) => set("copper", v)}
          />
        </div>
      </div>
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
  campaigns,
}: {
  form: FormState;
  campaigns: { id: string; name: string }[];
}) {
  const savingThrows = ABILITIES.filter((a) => form.saves[SAVE_FIELD[a.field]])
    .map((a) => a.key)
    .join(", ");
  const campaignName =
    form.campaignId === "NONE"
      ? "Unassigned"
      : (campaigns.find((c) => c.id === form.campaignId)?.name ?? "—");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 divide-y">
        <ReviewRow label="Name" value={form.characterName || "—"} />
        <ReviewRow
          label="Race"
          value={[form.race, form.subrace].filter(Boolean).join(" · ") || "—"}
        />
        <ReviewRow
          label="Alignment"
          value={
            form.alignment === "NONE"
              ? "Unaligned"
              : ALIGNMENTS[form.alignment as Alignment]
          }
        />
        <ReviewRow label="Size" value={SIZES[form.size]} />
        <ReviewRow
          label="Ability scores"
          value={ABILITIES.map((a) => form.scores[a.field]).join(" / ")}
        />
        <ReviewRow label="Saving throws" value={savingThrows || "None"} />
        <ReviewRow
          label="HP / AC"
          value={`${form.currentHitPoints || form.maxHitPoints || "0"}/${
            form.maxHitPoints || "0"
          } · AC ${form.armorClass || "—"}`}
        />
        <ReviewRow label="Campaign" value={campaignName} />
      </div>
      <p className="text-muted-foreground text-sm">
        You&apos;ll add classes, skills, spells, feats, items and other details
        from the character sheet next.
      </p>
    </div>
  );
}
