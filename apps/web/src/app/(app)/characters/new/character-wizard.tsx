"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type {
  Ability,
  Alignment,
  CharacterClassInput,
  CharacterSkillInput,
  CreateCharacterInput,
  CreatureSize,
  Skill,
  SkillProficiency,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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

const HIT_DICE: Record<string, string> = {
  "6": "d6",
  "8": "d8",
  "10": "d10",
  "12": "d12",
};

const CASTING_ABILITIES: Record<string, string> = {
  NONE: "Non-caster",
  INT: "Intelligence",
  WIS: "Wisdom",
  CHA: "Charisma",
  STR: "Strength",
  DEX: "Dexterity",
  CON: "Constitution",
};

const SKILLS: { key: Skill; label: string; ability: Ability }[] = [
  { key: "ACROBATICS", label: "Acrobatics", ability: "DEX" },
  { key: "ANIMAL_HANDLING", label: "Animal Handling", ability: "WIS" },
  { key: "ARCANA", label: "Arcana", ability: "INT" },
  { key: "ATHLETICS", label: "Athletics", ability: "STR" },
  { key: "DECEPTION", label: "Deception", ability: "CHA" },
  { key: "HISTORY", label: "History", ability: "INT" },
  { key: "INSIGHT", label: "Insight", ability: "WIS" },
  { key: "INTIMIDATION", label: "Intimidation", ability: "CHA" },
  { key: "INVESTIGATION", label: "Investigation", ability: "INT" },
  { key: "MEDICINE", label: "Medicine", ability: "WIS" },
  { key: "NATURE", label: "Nature", ability: "INT" },
  { key: "PERCEPTION", label: "Perception", ability: "WIS" },
  { key: "PERFORMANCE", label: "Performance", ability: "CHA" },
  { key: "PERSUASION", label: "Persuasion", ability: "CHA" },
  { key: "RELIGION", label: "Religion", ability: "INT" },
  { key: "SLEIGHT_OF_HAND", label: "Sleight of Hand", ability: "DEX" },
  { key: "STEALTH", label: "Stealth", ability: "DEX" },
  { key: "SURVIVAL", label: "Survival", ability: "WIS" },
];

const SKILL_PROFICIENCY: Record<string, string> = {
  NONE: "—",
  PROFICIENT: "Proficient",
  EXPERTISE: "Expertise",
  HALF: "Half",
};

const STEPS = [
  "Identity",
  "Class",
  "Abilities",
  "Combat",
  "Skills",
  "Roleplay",
  "Review",
];

// --- Local form state ------------------------------------------------------

interface ClassRow {
  className: string;
  subclass: string;
  level: string;
  hitDieSize: string;
  spellcastingAbility: string; // "NONE" | Ability
}

function emptyClass(): ClassRow {
  return {
    className: "",
    subclass: "",
    level: "1",
    hitDieSize: "8",
    spellcastingAbility: "NONE",
  };
}

type SkillState = Record<Skill, "NONE" | SkillProficiency>;

function emptySkills(): SkillState {
  return Object.fromEntries(SKILLS.map((s) => [s.key, "NONE"])) as SkillState;
}

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
  const [classes, setClasses] = useState<ClassRow[]>([emptyClass()]);
  const [skills, setSkills] = useState<SkillState>(emptySkills);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setScore = (field: AbilityField, value: string) =>
    setForm((f) => ({ ...f, scores: { ...f.scores, [field]: value } }));

  const toggleSave = (field: SaveField) =>
    setForm((f) => ({ ...f, saves: { ...f.saves, [field]: !f.saves[field] } }));

  const setClass = (i: number, patch: Partial<ClassRow>) =>
    setClasses((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );

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
      if (classes.length === 0) return "Add at least one class.";
      for (const c of classes) {
        if (!c.className.trim()) return "Each class needs a name.";
        const level = optNum(c.level);
        if (level === undefined || level < 1) return "Class level must be ≥ 1.";
      }
    }
    if (current === 2) {
      for (const a of ABILITIES) {
        const v = optNum(form.scores[a.field]);
        if (v === undefined || v < 1 || v > 30) {
          return `${a.label} must be between 1 and 30.`;
        }
      }
    }
    if (current === 3) {
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

    const classInputs: CharacterClassInput[] = classes.map((c) => ({
      className: c.className.trim(),
      subclass: optText(c.subclass) ?? null,
      level: optNum(c.level) ?? 1,
      hitDieSize: Number(c.hitDieSize),
      spellcastingAbility:
        c.spellcastingAbility === "NONE"
          ? null
          : (c.spellcastingAbility as Ability),
    }));

    const skillInputs: CharacterSkillInput[] = SKILLS.filter(
      (s) => skills[s.key] !== "NONE",
    ).map((s) => ({
      skill: s.key,
      proficiency: skills[s.key] as SkillProficiency,
    }));

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

      classes: classInputs,
      skills: skillInputs,
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
            <ClassStep
              classes={classes}
              setClass={setClass}
              addClass={() => setClasses((r) => [...r, emptyClass()])}
              removeClass={(i) =>
                setClasses((r) => r.filter((_, idx) => idx !== i))
              }
            />
          )}
          {step === 2 && (
            <AbilitiesStep
              form={form}
              setScore={setScore}
              toggleSave={toggleSave}
              applyStandardArray={applyStandardArray}
            />
          )}
          {step === 3 && <CombatStep form={form} set={set} />}
          {step === 4 && <SkillsStep skills={skills} setSkills={setSkills} />}
          {step === 5 && <RoleplayStep form={form} set={set} />}
          {step === 6 && (
            <ReviewStep
              form={form}
              classes={classes}
              skills={skills}
              campaigns={campaigns}
            />
          )}

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

// --- Small field helpers ---------------------------------------------------

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function EnumSelect({
  id,
  value,
  onValueChange,
  items,
  placeholder,
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  items: Record<string, string>;
  placeholder?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as string)}
      items={items}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(items).map(([val, label]) => (
          <SelectItem key={val} value={val}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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

function ClassStep({
  classes,
  setClass,
  addClass,
  removeClass,
}: {
  classes: ClassRow[];
  setClass: (i: number, patch: Partial<ClassRow>) => void;
  addClass: () => void;
  removeClass: (i: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {classes.map((c, i) => (
        <div key={i} className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">
              {classes.length > 1 ? `Class ${i + 1}` : "Class"}
            </p>
            {classes.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeClass(i)}
                aria-label="Remove class"
              >
                <Trash2Icon />
              </Button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`className-${i}`} label="Class name">
              <Input
                id={`className-${i}`}
                value={c.className}
                onChange={(e) => setClass(i, { className: e.target.value })}
                placeholder="Wizard, Fighter…"
              />
            </Field>
            <Field id={`subclass-${i}`} label="Subclass (optional)">
              <Input
                id={`subclass-${i}`}
                value={c.subclass}
                onChange={(e) => setClass(i, { subclass: e.target.value })}
                placeholder="Evocation…"
              />
            </Field>
            <Field id={`level-${i}`} label="Level">
              <Input
                id={`level-${i}`}
                type="number"
                min={1}
                value={c.level}
                onChange={(e) => setClass(i, { level: e.target.value })}
              />
            </Field>
            <Field id={`hitDie-${i}`} label="Hit die">
              <EnumSelect
                id={`hitDie-${i}`}
                value={c.hitDieSize}
                onValueChange={(v) => setClass(i, { hitDieSize: v })}
                items={HIT_DICE}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field id={`casting-${i}`} label="Spellcasting ability">
                <EnumSelect
                  id={`casting-${i}`}
                  value={c.spellcastingAbility}
                  onValueChange={(v) => setClass(i, { spellcastingAbility: v })}
                  items={CASTING_ABILITIES}
                />
              </Field>
            </div>
          </div>
        </div>
      ))}
      <div>
        <Button variant="outline" size="sm" onClick={addClass}>
          <PlusIcon />
          Add another class
        </Button>
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

function SkillsStep({
  skills,
  setSkills,
}: {
  skills: SkillState;
  setSkills: React.Dispatch<React.SetStateAction<SkillState>>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {SKILLS.map((s) => (
        <div
          key={s.key}
          className="flex items-center justify-between gap-3 rounded-md border p-2 pl-3"
        >
          <span className="text-sm">
            {s.label}
            <span className="text-muted-foreground ml-1 text-xs">
              ({s.ability})
            </span>
          </span>
          <div className="w-32 shrink-0">
            <EnumSelect
              value={skills[s.key]}
              onValueChange={(v) =>
                setSkills((prev) => ({
                  ...prev,
                  [s.key]: v as "NONE" | SkillProficiency,
                }))
              }
              items={SKILL_PROFICIENCY}
            />
          </div>
        </div>
      ))}
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
  classes,
  skills,
  campaigns,
}: {
  form: FormState;
  classes: ClassRow[];
  skills: SkillState;
  campaigns: { id: string; name: string }[];
}) {
  const classLine = classes
    .filter((c) => c.className.trim())
    .map((c) => `${c.className.trim()} ${c.level}`)
    .join(" / ");
  const chosenSkills = SKILLS.filter((s) => skills[s.key] !== "NONE")
    .map((s) => s.label)
    .join(", ");
  const savingThrows = ABILITIES.filter((a) => form.saves[SAVE_FIELD[a.field]])
    .map((a) => a.key)
    .join(", ");
  const campaignName =
    form.campaignId === "NONE"
      ? "Unassigned"
      : (campaigns.find((c) => c.id === form.campaignId)?.name ?? "—");

  return (
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
      <ReviewRow label="Classes" value={classLine || "—"} />
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
      <ReviewRow label="Skills" value={chosenSkills || "None"} />
      <ReviewRow label="Campaign" value={campaignName} />
    </div>
  );
}
