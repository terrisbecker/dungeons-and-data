"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import type {
  Ability,
  CharacterSheet,
  RestType,
  Skill,
  SkillProficiency,
} from "@dnd/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// --- Reference data --------------------------------------------------------

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

const PROFICIENCY_ITEMS: Record<SkillProficiency, string> = {
  PROFICIENT: "Proficient",
  EXPERTISE: "Expertise",
  HALF: "Half",
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

const REST_TYPES: Record<RestType, string> = {
  SHORT: "Short rest",
  LONG: "Long rest",
};

// --- Mutation helpers ------------------------------------------------------

async function postChild(topic: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(`/api/character-children/${topic}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const parsed = await res.json().catch(() => null);
      toast.error(parsed?.error ?? "Could not add entry");
      return false;
    }
    return true;
  } catch {
    toast.error("Could not reach the server");
    return false;
  }
}

async function deleteChild(topic: string, id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/character-children/${topic}/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const parsed = await res.json().catch(() => null);
      toast.error(parsed?.error ?? "Could not remove entry");
      return false;
    }
    return true;
  } catch {
    toast.error("Could not reach the server");
    return false;
  }
}

// --- Shared layout primitives ----------------------------------------------

function SectionCard({
  title,
  description,
  addLabel,
  dialogTitle,
  onOpenChange,
  open,
  form,
  children,
}: {
  title: string;
  description?: string;
  addLabel: string;
  dialogTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger render={<Button size="sm" variant="outline" />}>
              <PlusIcon />
              {addLabel}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
              </DialogHeader>
              {form}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function RemoveButton({ onRemove }: { onRemove: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Remove"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await onRemove();
        setBusy(false);
      }}
    >
      <XIcon />
    </Button>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-muted-foreground text-sm">{text}</p>;
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

function DialogButtons({ submitting }: { submitting: boolean }) {
  return (
    <DialogFooter>
      <DialogClose render={<Button type="button" variant="outline" />}>
        Cancel
      </DialogClose>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Adding…" : "Add"}
      </Button>
    </DialogFooter>
  );
}

// --- Classes ---------------------------------------------------------------

export function ClassesSection({
  characterId,
  classes,
}: {
  characterId: string;
  classes: CharacterSheet["classes"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [className, setClassName] = useState("");
  const [subclass, setSubclass] = useState("");
  const [level, setLevel] = useState("1");
  const [hitDieSize, setHitDieSize] = useState("8");
  const [casting, setCasting] = useState("NONE");

  function reset() {
    setClassName("");
    setSubclass("");
    setLevel("1");
    setHitDieSize("8");
    setCasting("NONE");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!className.trim()) {
      toast.error("Enter a class name.");
      return;
    }
    const lvl = Number(level);
    if (!Number.isFinite(lvl) || lvl < 1) {
      toast.error("Level must be ≥ 1.");
      return;
    }
    setSubmitting(true);
    const ok = await postChild("character-classes", {
      characterId,
      className: className.trim(),
      subclass: subclass.trim() || null,
      level: lvl,
      hitDieSize: Number(hitDieSize),
      spellcastingAbility: casting === "NONE" ? null : casting,
    });
    setSubmitting(false);
    if (ok) {
      toast.success("Class added");
      setOpen(false);
      reset();
      router.refresh();
    }
  }

  async function onRemove(id: string) {
    const ok = await deleteChild("character-classes", id);
    if (ok) {
      toast.success("Class removed");
      router.refresh();
    }
  }

  return (
    <SectionCard
      title="Classes"
      description="Multiclassing is supported — add a row per class."
      addLabel="Add class"
      dialogTitle="Add class"
      open={open}
      onOpenChange={setOpen}
      form={
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="class-name">Class name</Label>
              <Input
                id="class-name"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Wizard, Fighter…"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="class-subclass">Subclass (optional)</Label>
              <Input
                id="class-subclass"
                value={subclass}
                onChange={(e) => setSubclass(e.target.value)}
                placeholder="Evocation…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="class-level">Level</Label>
              <Input
                id="class-level"
                type="number"
                min={1}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="class-hit-die">Hit die</Label>
              <EnumSelect
                id="class-hit-die"
                value={hitDieSize}
                onValueChange={setHitDieSize}
                items={HIT_DICE}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="class-casting">Spellcasting ability</Label>
              <EnumSelect
                id="class-casting"
                value={casting}
                onValueChange={setCasting}
                items={CASTING_ABILITIES}
              />
            </div>
          </div>
          <DialogButtons submitting={submitting} />
        </form>
      }
    >
      {classes.length === 0 ? (
        <EmptyState text="No classes yet." />
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {classes.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <span>
                <span className="font-medium">{c.className}</span>
                {c.subclass && (
                  <span className="text-muted-foreground"> ({c.subclass})</span>
                )}
                <span className="text-muted-foreground">
                  {" "}
                  · Level {c.level} · d{c.hitDieSize}
                </span>
              </span>
              <RemoveButton onRemove={() => onRemove(c.id)} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// --- Skills ----------------------------------------------------------------

export function SkillsSection({
  characterId,
  skills,
  skillModifiers,
}: {
  characterId: string;
  skills: CharacterSheet["skills"];
  skillModifiers: Record<Skill, number>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const proficiencyById = new Map(skills.map((s) => [s.skill, s]));
  const available = SKILLS.filter((s) => !proficiencyById.has(s.key));

  const [skill, setSkill] = useState<string>(available[0]?.key ?? "");
  const [proficiency, setProficiency] =
    useState<SkillProficiency>("PROFICIENT");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!skill) {
      toast.error("Select a skill.");
      return;
    }
    setSubmitting(true);
    const ok = await postChild("character-skills", {
      characterId,
      skill,
      proficiency,
    });
    setSubmitting(false);
    if (ok) {
      toast.success("Skill proficiency added");
      setOpen(false);
      router.refresh();
    }
  }

  async function onRemove(id: string) {
    const ok = await deleteChild("character-skills", id);
    if (ok) {
      toast.success("Skill proficiency removed");
      router.refresh();
    }
  }

  const skillItems: Record<string, string> = Object.fromEntries(
    available.map((s) => [s.key, `${s.label} (${s.ability})`]),
  );

  function fmt(n: number): string {
    return n >= 0 ? `+${n}` : `${n}`;
  }

  return (
    <SectionCard
      title="Skills"
      description="All 18 skills show their computed modifier; add or remove proficiencies here."
      addLabel="Add proficiency"
      dialogTitle="Add skill proficiency"
      open={open}
      onOpenChange={setOpen}
      form={
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {available.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              This character is already proficient in every skill.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="skill-key">Skill</Label>
                <EnumSelect
                  id="skill-key"
                  value={skill}
                  onValueChange={setSkill}
                  items={skillItems}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="skill-proficiency">Proficiency</Label>
                <EnumSelect
                  id="skill-proficiency"
                  value={proficiency}
                  onValueChange={(v) => setProficiency(v as SkillProficiency)}
                  items={PROFICIENCY_ITEMS}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={submitting || available.length === 0}
            >
              {submitting ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      }
    >
      <div className="grid gap-1 sm:grid-cols-2">
        {SKILLS.map((s) => {
          const row = proficiencyById.get(s.key);
          return (
            <div
              key={s.key}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm"
            >
              <span className="flex items-center gap-2">
                <span className="tabular-nums">
                  {fmt(skillModifiers[s.key])}
                </span>
                <span className={row ? "font-medium" : ""}>{s.label}</span>
                <span className="text-muted-foreground text-xs">
                  ({s.ability})
                </span>
              </span>
              {row && (
                <span className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {PROFICIENCY_ITEMS[row.proficiency]}
                  </Badge>
                  <RemoveButton onRemove={() => onRemove(row.id)} />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// --- Spell slots -----------------------------------------------------------

export function SpellSlotsSection({
  characterId,
  spellSlots,
}: {
  characterId: string;
  spellSlots: CharacterSheet["spellSlots"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [level, setLevel] = useState("1");
  const [max, setMax] = useState("1");
  const [used, setUsed] = useState("0");
  const [isPact, setIsPact] = useState(false);

  function reset() {
    setLevel("1");
    setMax("1");
    setUsed("0");
    setIsPact(false);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const lvl = Number(level);
    const maxN = Number(max);
    const usedN = Number(used);
    if (!Number.isFinite(lvl) || lvl < 1 || lvl > 9) {
      toast.error("Slot level must be between 1 and 9.");
      return;
    }
    if (!Number.isFinite(maxN) || maxN < 0) {
      toast.error("Max slots must be ≥ 0.");
      return;
    }
    if (!Number.isFinite(usedN) || usedN < 0 || usedN > maxN) {
      toast.error("Used slots must be between 0 and max.");
      return;
    }
    setSubmitting(true);
    const ok = await postChild("spell-slots", {
      characterId,
      level: lvl,
      max: maxN,
      used: usedN,
      isPact,
    });
    setSubmitting(false);
    if (ok) {
      toast.success("Spell slots added");
      setOpen(false);
      reset();
      router.refresh();
    }
  }

  async function onRemove(id: string) {
    const ok = await deleteChild("spell-slots", id);
    if (ok) {
      toast.success("Spell slots removed");
      router.refresh();
    }
  }

  const ordered = [...spellSlots].sort(
    (a, b) => Number(a.isPact) - Number(b.isPact) || a.level - b.level,
  );

  return (
    <SectionCard
      title="Spell Slots"
      description="Per-level slot tracks; mark Warlock pact magic separately."
      addLabel="Add slots"
      dialogTitle="Add spell slot track"
      open={open}
      onOpenChange={setOpen}
      form={
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="slot-level">Level (1–9)</Label>
              <Input
                id="slot-level"
                type="number"
                min={1}
                max={9}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slot-max">Max</Label>
              <Input
                id="slot-max"
                type="number"
                min={0}
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slot-used">Used</Label>
              <Input
                id="slot-used"
                type="number"
                min={0}
                value={used}
                onChange={(e) => setUsed(e.target.value)}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={isPact}
              onChange={(e) => setIsPact(e.target.checked)}
            />
            Warlock pact magic slot
          </label>
          <DialogButtons submitting={submitting} />
        </form>
      }
    >
      {ordered.length === 0 ? (
        <EmptyState text="No spell slots yet." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {ordered.map((slot) => (
            <span
              key={slot.id}
              className="flex items-center gap-1 rounded-md border py-1 pr-1 pl-2.5 text-sm"
            >
              <span>
                {slot.isPact ? "Pact" : `Lvl ${slot.level}`}:{" "}
                {slot.max - slot.used}/{slot.max}
              </span>
              <RemoveButton onRemove={() => onRemove(slot.id)} />
            </span>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// --- Resources -------------------------------------------------------------

export function ResourcesSection({
  characterId,
  resources,
}: {
  characterId: string;
  resources: CharacterSheet["resources"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [current, setCurrent] = useState("0");
  const [max, setMax] = useState("1");
  const [rechargeOn, setRechargeOn] = useState<RestType>("LONG");

  function reset() {
    setName("");
    setCurrent("0");
    setMax("1");
    setRechargeOn("LONG");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!name.trim()) {
      toast.error("Enter a resource name.");
      return;
    }
    const currentN = Number(current);
    const maxN = Number(max);
    if (!Number.isFinite(maxN) || maxN < 0) {
      toast.error("Max must be ≥ 0.");
      return;
    }
    if (!Number.isFinite(currentN) || currentN < 0) {
      toast.error("Current must be ≥ 0.");
      return;
    }
    setSubmitting(true);
    const ok = await postChild("character-resources", {
      characterId,
      name: name.trim(),
      current: currentN,
      max: maxN,
      rechargeOn,
    });
    setSubmitting(false);
    if (ok) {
      toast.success("Resource added");
      setOpen(false);
      reset();
      router.refresh();
    }
  }

  async function onRemove(id: string) {
    const ok = await deleteChild("character-resources", id);
    if (ok) {
      toast.success("Resource removed");
      router.refresh();
    }
  }

  return (
    <SectionCard
      title="Resources"
      description="Limited-use pools like Rage, Ki, or Channel Divinity."
      addLabel="Add resource"
      dialogTitle="Add resource"
      open={open}
      onOpenChange={setOpen}
      form={
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="resource-name">Name</Label>
            <Input
              id="resource-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rage, Ki, Bardic Inspiration…"
              autoFocus
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="resource-current">Current</Label>
              <Input
                id="resource-current"
                type="number"
                min={0}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="resource-max">Max</Label>
              <Input
                id="resource-max"
                type="number"
                min={0}
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="resource-recharge">Recharges on</Label>
              <EnumSelect
                id="resource-recharge"
                value={rechargeOn}
                onValueChange={(v) => setRechargeOn(v as RestType)}
                items={REST_TYPES}
              />
            </div>
          </div>
          <DialogButtons submitting={submitting} />
        </form>
      }
    >
      {resources.length === 0 ? (
        <EmptyState text="No resources yet." />
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {resources.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <span>
                <span className="font-medium">{r.name}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {r.current}/{r.max} · {REST_TYPES[r.rechargeOn]}
                </span>
              </span>
              <RemoveButton onRemove={() => onRemove(r.id)} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// --- Proficiencies ---------------------------------------------------------

export function ProficienciesSection({
  characterId,
  proficiencies,
}: {
  characterId: string;
  proficiencies: CharacterSheet["proficiencies"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState("");
  const [name, setName] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!type.trim()) {
      toast.error("Enter a proficiency type.");
      return;
    }
    if (!name.trim()) {
      toast.error("Enter a proficiency name.");
      return;
    }
    setSubmitting(true);
    const ok = await postChild("proficiencies", {
      characterId,
      type: type.trim(),
      name: name.trim(),
    });
    setSubmitting(false);
    if (ok) {
      toast.success("Proficiency added");
      setOpen(false);
      setType("");
      setName("");
      router.refresh();
    }
  }

  async function onRemove(id: string) {
    const ok = await deleteChild("proficiencies", id);
    if (ok) {
      toast.success("Proficiency removed");
      router.refresh();
    }
  }

  return (
    <SectionCard
      title="Proficiencies"
      description="Weapon, armor, tool, language, and other proficiencies."
      addLabel="Add proficiency"
      dialogTitle="Add proficiency"
      open={open}
      onOpenChange={setOpen}
      form={
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="prof-type">Type</Label>
              <Input
                id="prof-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Weapon, Tool, Language…"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="prof-name">Name</Label>
              <Input
                id="prof-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Longsword, Thieves' Tools…"
              />
            </div>
          </div>
          <DialogButtons submitting={submitting} />
        </form>
      }
    >
      {proficiencies.length === 0 ? (
        <EmptyState text="No proficiencies yet." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {proficiencies.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1 rounded-md border py-1 pr-1 pl-2.5 text-sm"
            >
              <span>
                {p.name}
                <span className="text-muted-foreground ml-1 text-xs">
                  {p.type}
                </span>
              </span>
              <RemoveButton onRemove={() => onRemove(p.id)} />
            </span>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// --- Conditions ------------------------------------------------------------

export function ConditionsSection({
  characterId,
  conditions,
}: {
  characterId: string;
  conditions: CharacterSheet["conditions"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setName("");
    setLevel("");
    setNotes("");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!name.trim()) {
      toast.error("Enter a condition name.");
      return;
    }
    let levelValue: number | null = null;
    if (level.trim() !== "") {
      const lvl = Number(level);
      if (!Number.isFinite(lvl) || lvl < 1) {
        toast.error("Level must be ≥ 1.");
        return;
      }
      levelValue = lvl;
    }
    setSubmitting(true);
    const ok = await postChild("character-conditions", {
      characterId,
      name: name.trim(),
      level: levelValue,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (ok) {
      toast.success("Condition added");
      setOpen(false);
      reset();
      router.refresh();
    }
  }

  async function onRemove(id: string) {
    const ok = await deleteChild("character-conditions", id);
    if (ok) {
      toast.success("Condition removed");
      router.refresh();
    }
  }

  return (
    <SectionCard
      title="Conditions"
      description="Active status effects such as poisoned, prone, or exhaustion."
      addLabel="Add condition"
      dialogTitle="Add condition"
      open={open}
      onOpenChange={setOpen}
      form={
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="condition-name">Name</Label>
              <Input
                id="condition-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Poisoned, Exhaustion…"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="condition-level">Level (optional)</Label>
              <Input
                id="condition-level"
                type="number"
                min={1}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="e.g. Exhaustion 2"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="condition-notes">Notes (optional)</Label>
            <Textarea
              id="condition-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <DialogButtons submitting={submitting} />
        </form>
      }
    >
      {conditions.length === 0 ? (
        <EmptyState text="No conditions." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {conditions.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1 rounded-md border py-1 pr-1 pl-2.5 text-sm"
            >
              <span>
                {c.name}
                {c.level != null && ` ${c.level}`}
              </span>
              <RemoveButton onRemove={() => onRemove(c.id)} />
            </span>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
