"use client";

import { useCallback, useState } from "react";
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
  DAMAGE_TYPES,
  SAVE_ABILITIES as ABILITIES,
  SPELL_SCHOOLS as SCHOOLS,
  SpellDetail,
} from "@/components/catalog-detail";
import {
  ALL_FILTER,
  boolFilterItems,
  CatalogSearchInput,
  FilterBar,
  matchesName,
  withAll,
} from "./catalog-filters";
import {
  CatalogManager,
  FormActions,
  patchCatalog,
  postCatalog,
} from "./catalog-shared";

const CONCENTRATION_ITEMS = boolFilterItems("Concentration", "No");
const RITUAL_ITEMS = boolFilterItems("Ritual", "No");
const LEVEL_ITEMS: Record<string, string> = {
  [ALL_FILTER]: "All levels",
  "0": "Cantrip",
  "1": "Level 1",
  "2": "Level 2",
  "3": "Level 3",
  "4": "Level 4",
  "5": "Level 5",
  "6": "Level 6",
  "7": "Level 7",
  "8": "Level 8",
  "9": "Level 9",
};

export function SpellCatalogManager({ rows }: { rows: SpellCatalog[] }) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState(ALL_FILTER);
  const [school, setSchool] = useState(ALL_FILTER);
  const [concentration, setConcentration] = useState(ALL_FILTER);
  const [ritual, setRitual] = useState(ALL_FILTER);

  const rowFilter = useCallback(
    (spell: SpellCatalog) => {
      if (!matchesName(spell.name, search)) return false;
      if (level !== ALL_FILTER && String(spell.level) !== level) return false;
      if (school !== ALL_FILTER && (spell.school ?? "NONE") !== school)
        return false;
      if (
        concentration !== ALL_FILTER &&
        spell.concentration !== (concentration === "TRUE")
      )
        return false;
      if (ritual !== ALL_FILTER && spell.ritual !== (ritual === "TRUE"))
        return false;
      return true;
    },
    [search, level, school, concentration, ritual],
  );

  const toolbar = (
    <FilterBar>
      <CatalogSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search spells by name…"
      />
      <EnumSelect value={level} onValueChange={setLevel} items={LEVEL_ITEMS} />
      <EnumSelect
        value={school}
        onValueChange={setSchool}
        items={withAll(SCHOOLS, "All schools")}
      />
      <EnumSelect
        value={concentration}
        onValueChange={setConcentration}
        items={CONCENTRATION_ITEMS}
      />
      <EnumSelect
        value={ritual}
        onValueChange={setRitual}
        items={RITUAL_ITEMS}
      />
    </FilterBar>
  );

  return (
    <CatalogManager
      topic="spells"
      title="Spells"
      singular="spell"
      rows={rows}
      emptyText="No spells in the catalog yet."
      toolbar={toolbar}
      rowFilter={rowFilter}
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
