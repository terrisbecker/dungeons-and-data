"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  Ability,
  CreateSpellInput,
  DamageType,
  SpellCatalog,
  SpellSchool,
} from "@dnd/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EnumSelect, Field } from "@/components/form-fields";
import {
  CatalogManager,
  DetailBody,
  DetailHeader,
  DetailRow,
  DetailText,
  FormActions,
  patchCatalog,
  postCatalog,
} from "./catalog-shared";

const SCHOOLS: Record<string, string> = {
  NONE: "—",
  ABJURATION: "Abjuration",
  CONJURATION: "Conjuration",
  DIVINATION: "Divination",
  ENCHANTMENT: "Enchantment",
  EVOCATION: "Evocation",
  ILLUSION: "Illusion",
  NECROMANCY: "Necromancy",
  TRANSMUTATION: "Transmutation",
};

const ABILITIES: Record<string, string> = {
  NONE: "None",
  STR: "Strength",
  DEX: "Dexterity",
  CON: "Constitution",
  INT: "Intelligence",
  WIS: "Wisdom",
  CHA: "Charisma",
};

const DAMAGE_TYPES: Record<string, string> = {
  NONE: "None",
  ACID: "Acid",
  BLUDGEONING: "Bludgeoning",
  COLD: "Cold",
  FIRE: "Fire",
  FORCE: "Force",
  LIGHTNING: "Lightning",
  NECROTIC: "Necrotic",
  PIERCING: "Piercing",
  POISON: "Poison",
  PSYCHIC: "Psychic",
  RADIANT: "Radiant",
  SLASHING: "Slashing",
  THUNDER: "Thunder",
};

export function SpellCatalogManager({ rows }: { rows: SpellCatalog[] }) {
  return (
    <CatalogManager
      topic="spells"
      title="Spells"
      singular="spell"
      rows={rows}
      emptyText="No spells in the catalog yet."
      renderRow={(spell) => (
        <>
          <span className="font-medium">{spell.name}</span>
          <span className="text-muted-foreground text-xs">
            {" "}
            · {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`}
            {spell.school ? ` · ${SCHOOLS[spell.school]}` : ""}
            {spell.concentration ? " · Concentration" : ""}
            {spell.ritual ? " · Ritual" : ""}
          </span>
        </>
      )}
      renderForm={({ editing, close }) => (
        <SpellForm key={editing?.id ?? "new"} editing={editing} close={close} />
      )}
      renderDetail={(spell) => <SpellDetail spell={spell} />}
    />
  );
}

function SpellDetail({ spell }: { spell: SpellCatalog }) {
  const components = [
    spell.verbal ? "V" : null,
    spell.somatic ? "S" : null,
    spell.material ? "M" : null,
  ].filter(Boolean);

  const tags = [
    spell.concentration ? "Concentration" : null,
    spell.ritual ? "Ritual" : null,
  ].filter(Boolean);

  return (
    <>
      <DetailHeader
        title={spell.name}
        subtitle={`${
          spell.level === 0 ? "Cantrip" : `Level ${spell.level}`
        }${spell.school ? ` · ${SCHOOLS[spell.school]}` : ""}`}
      />
      <DetailBody>
        <DetailRow label="Casting time" value={spell.castingTime} />
        <DetailRow label="Range" value={spell.range} />
        <DetailRow label="Duration" value={spell.duration} />
        <DetailRow
          label="Components"
          value={
            components.length > 0
              ? `${components.join(", ")}${
                  spell.material && spell.materialComponent
                    ? ` (${spell.materialComponent})`
                    : ""
                }`
              : null
          }
        />
        <DetailRow
          label="Save"
          value={spell.savingThrow ? ABILITIES[spell.savingThrow] : null}
        />
        <DetailRow
          label="Damage"
          value={spell.damageType ? DAMAGE_TYPES[spell.damageType] : null}
        />
        <DetailRow label="Attack roll" value={spell.isAttack ? "Yes" : null} />
        <DetailRow label="" value={tags.length > 0 ? tags.join(" · ") : null} />
      </DetailBody>
      <DetailText text={spell.description} />
      {spell.higherLevel ? (
        <p className="mt-2 whitespace-pre-wrap">
          <span className="font-medium">At higher levels. </span>
          <span className="text-muted-foreground">{spell.higherLevel}</span>
        </p>
      ) : null}
    </>
  );
}

function SpellForm({
  editing,
  close,
}: {
  editing: SpellCatalog | null;
  close: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(editing?.name ?? "");
  const [level, setLevel] = useState(String(editing?.level ?? 0));
  const [school, setSchool] = useState(editing?.school ?? "NONE");
  const [castingTime, setCastingTime] = useState(editing?.castingTime ?? "");
  const [range, setRange] = useState(editing?.range ?? "");
  const [duration, setDuration] = useState(editing?.duration ?? "");
  const [higherLevel, setHigherLevel] = useState(editing?.higherLevel ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [verbal, setVerbal] = useState(editing?.verbal ?? false);
  const [somatic, setSomatic] = useState(editing?.somatic ?? false);
  const [material, setMaterial] = useState(editing?.material ?? false);
  const [materialComponent, setMaterialComponent] = useState(
    editing?.materialComponent ?? "",
  );
  const [concentration, setConcentration] = useState(
    editing?.concentration ?? false,
  );
  const [ritual, setRitual] = useState(editing?.ritual ?? false);
  const [savingThrow, setSavingThrow] = useState(
    editing?.savingThrow ?? "NONE",
  );
  const [damageType, setDamageType] = useState(editing?.damageType ?? "NONE");
  const [isAttack, setIsAttack] = useState(editing?.isAttack ?? false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!name.trim()) {
      toast.error("Enter a spell name.");
      return;
    }
    const lvl = Number(level);
    if (!Number.isFinite(lvl) || lvl < 0 || lvl > 9) {
      toast.error("Level must be between 0 and 9.");
      return;
    }
    const body: CreateSpellInput = {
      name: name.trim(),
      level: lvl,
      school: school === "NONE" ? undefined : (school as SpellSchool),
      castingTime: castingTime.trim() || undefined,
      range: range.trim() || undefined,
      duration: duration.trim() || undefined,
      higherLevel: higherLevel.trim() || undefined,
      description: description.trim() || undefined,
      verbal,
      somatic,
      material,
      materialComponent: materialComponent.trim() || undefined,
      concentration,
      ritual,
      savingThrow:
        savingThrow === "NONE" ? undefined : (savingThrow as Ability),
      damageType:
        damageType === "NONE" ? undefined : (damageType as DamageType),
      isAttack,
    };
    setSubmitting(true);
    const ok = editing
      ? await patchCatalog("spells", editing.id, body)
      : await postCatalog("spells", body);
    setSubmitting(false);
    if (ok) {
      toast.success(editing ? "Spell updated" : "Spell added");
      close();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="spell-name" label="Name">
          <Input
            id="spell-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Field>
        <Field id="spell-level" label="Level (0 = cantrip)">
          <Input
            id="spell-level"
            type="number"
            min={0}
            max={9}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          />
        </Field>
        <Field id="spell-school" label="School">
          <EnumSelect
            id="spell-school"
            value={school}
            onValueChange={setSchool}
            items={SCHOOLS}
          />
        </Field>
        <Field id="spell-casting" label="Casting time">
          <Input
            id="spell-casting"
            value={castingTime}
            onChange={(e) => setCastingTime(e.target.value)}
            placeholder="1 action…"
          />
        </Field>
        <Field id="spell-range" label="Range">
          <Input
            id="spell-range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="60 feet…"
          />
        </Field>
        <Field id="spell-duration" label="Duration">
          <Input
            id="spell-duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Instantaneous…"
          />
        </Field>
        <Field id="spell-save" label="Saving throw">
          <EnumSelect
            id="spell-save"
            value={savingThrow}
            onValueChange={setSavingThrow}
            items={ABILITIES}
          />
        </Field>
        <Field id="spell-damage" label="Damage type">
          <EnumSelect
            id="spell-damage"
            value={damageType}
            onValueChange={setDamageType}
            items={DAMAGE_TYPES}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Checkbox label="Verbal" checked={verbal} onChange={setVerbal} />
        <Checkbox label="Somatic" checked={somatic} onChange={setSomatic} />
        <Checkbox label="Material" checked={material} onChange={setMaterial} />
        <Checkbox
          label="Concentration"
          checked={concentration}
          onChange={setConcentration}
        />
        <Checkbox label="Ritual" checked={ritual} onChange={setRitual} />
        <Checkbox
          label="Spell attack"
          checked={isAttack}
          onChange={setIsAttack}
        />
      </div>

      {material && (
        <Field id="spell-material" label="Material component (optional)">
          <Input
            id="spell-material"
            value={materialComponent}
            onChange={(e) => setMaterialComponent(e.target.value)}
            placeholder="a pinch of sulfur…"
          />
        </Field>
      )}

      <Field id="spell-higher" label="At higher levels (optional)">
        <Textarea
          id="spell-higher"
          value={higherLevel}
          onChange={(e) => setHigherLevel(e.target.value)}
          rows={2}
        />
      </Field>
      <Field id="spell-desc" label="Description (optional)">
        <Textarea
          id="spell-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </Field>
      <FormActions
        submitting={submitting}
        editing={editing !== null}
        onCancel={close}
      />
    </form>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
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
