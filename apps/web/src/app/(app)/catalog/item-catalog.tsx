"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  ArmorCategory,
  CreateItemInput,
  DamageType,
  ItemCatalog,
  ItemRarity,
  ItemType,
  WeaponCategory,
  WeaponProperty,
} from "@dnd/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EnumSelect, Field } from "@/components/form-fields";
import {
  ARMOR_CATEGORIES,
  DAMAGE_TYPES,
  ITEM_RARITIES as RARITIES,
  ITEM_TYPES as TYPES,
  ItemDetail,
  WEAPON_CATEGORIES,
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

const MAGIC_ITEMS = boolFilterItems("Magic", "Mundane");
const ATTUNEMENT_ITEMS = boolFilterItems("Requires", "No");

const WEAPON_PROPERTIES: WeaponProperty[] = [
  "AMMUNITION",
  "FINESSE",
  "HEAVY",
  "LIGHT",
  "LOADING",
  "RANGE",
  "REACH",
  "SPECIAL",
  "THROWN",
  "TWO_HANDED",
  "VERSATILE",
];

function optNum(value: string): number | undefined {
  const t = value.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export function ItemCatalogManager({ rows }: { rows: ItemCatalog[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState(ALL_FILTER);
  const [rarity, setRarity] = useState(ALL_FILTER);
  const [magic, setMagic] = useState(ALL_FILTER);
  const [attunement, setAttunement] = useState(ALL_FILTER);

  const rowFilter = useCallback(
    (item: ItemCatalog) => {
      if (!matchesName(item.name, search)) return false;
      if (type !== ALL_FILTER && item.type !== type) return false;
      if (rarity !== ALL_FILTER && item.rarity !== rarity) return false;
      if (magic !== ALL_FILTER && item.isMagic !== (magic === "TRUE"))
        return false;
      if (
        attunement !== ALL_FILTER &&
        item.requiresAttunement !== (attunement === "TRUE")
      )
        return false;
      return true;
    },
    [search, type, rarity, magic, attunement],
  );

  const toolbar = (
    <FilterBar>
      <CatalogSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search items by name…"
      />
      <EnumSelect
        value={type}
        onValueChange={setType}
        items={withAll(TYPES, "All types")}
      />
      <EnumSelect
        value={rarity}
        onValueChange={setRarity}
        items={withAll(RARITIES, "All rarities")}
      />
      <EnumSelect value={magic} onValueChange={setMagic} items={MAGIC_ITEMS} />
      <EnumSelect
        value={attunement}
        onValueChange={setAttunement}
        items={ATTUNEMENT_ITEMS}
      />
    </FilterBar>
  );

  return (
    <CatalogManager
      topic="items"
      title="Items"
      singular="item"
      rows={rows}
      emptyText="No items in the catalog yet."
      toolbar={toolbar}
      rowFilter={rowFilter}
      renderRow={(item) => (
        <>
          <span className="font-medium">{item.name}</span>
          <span className="text-muted-foreground text-xs">
            {" "}
            · {TYPES[item.type]} · {RARITIES[item.rarity]}
            {item.requiresAttunement ? " · attunement" : ""}
          </span>
        </>
      )}
      renderForm={({ editing, close }) => (
        <ItemForm key={editing?.id ?? "new"} editing={editing} close={close} />
      )}
      renderDetail={(item) => <ItemDetail item={item} />}
    />
  );
}

function ItemForm({
  editing,
  close,
}: {
  editing: ItemCatalog | null;
  close: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Base fields.
  const [name, setName] = useState(editing?.name ?? "");
  const [type, setType] = useState<ItemType>(
    editing?.type ?? "ADVENTURING_GEAR",
  );
  const [rarity, setRarity] = useState<ItemRarity>(editing?.rarity ?? "COMMON");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [tags, setTags] = useState((editing?.tags ?? []).join(", "));
  const [weight, setWeight] = useState(
    editing?.weight != null ? String(editing.weight) : "",
  );
  const [baseValueCp, setBaseValueCp] = useState(
    editing?.baseValueCp != null ? String(editing.baseValueCp) : "",
  );
  const [isMagic, setIsMagic] = useState(editing?.isMagic ?? false);
  const [requiresAttunement, setRequiresAttunement] = useState(
    editing?.requiresAttunement ?? false,
  );
  const [stackable, setStackable] = useState(editing?.stackable ?? false);
  const [consumable, setConsumable] = useState(editing?.consumable ?? false);

  // Weapon satellite.
  const [weaponCategory, setWeaponCategory] = useState<WeaponCategory>(
    editing?.weaponCategory ?? "SIMPLE",
  );
  const [damageDice, setDamageDice] = useState(editing?.damageDice ?? "");
  const [damageType, setDamageType] = useState<DamageType>(
    editing?.damageType ?? "SLASHING",
  );
  const [versatileDamage, setVersatileDamage] = useState(
    editing?.versatileDamage ?? "",
  );
  const [weaponProperties, setWeaponProperties] = useState<WeaponProperty[]>(
    editing?.weaponProperties ?? [],
  );
  const [rangeNormal, setRangeNormal] = useState(
    editing?.rangeNormal != null ? String(editing.rangeNormal) : "",
  );
  const [rangeLong, setRangeLong] = useState(
    editing?.rangeLong != null ? String(editing.rangeLong) : "",
  );

  // Armor satellite.
  const [armorCategory, setArmorCategory] = useState<ArmorCategory>(
    editing?.armorCategory ?? "LIGHT",
  );
  const [baseArmorClass, setBaseArmorClass] = useState(
    editing?.baseArmorClass != null ? String(editing.baseArmorClass) : "",
  );
  const [addDexToArmorClass, setAddDexToArmorClass] = useState(
    editing?.addDexToArmorClass ?? false,
  );
  const [maxDexBonus, setMaxDexBonus] = useState(
    editing?.maxDexBonus != null ? String(editing.maxDexBonus) : "",
  );
  const [strengthRequirement, setStrengthRequirement] = useState(
    editing?.strengthRequirement != null
      ? String(editing.strengthRequirement)
      : "",
  );
  const [stealthDisadvantage, setStealthDisadvantage] = useState(
    editing?.stealthDisadvantage ?? false,
  );

  function toggleProperty(p: WeaponProperty) {
    setWeaponProperties((props) =>
      props.includes(p) ? props.filter((x) => x !== p) : [...props, p],
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!name.trim()) {
      toast.error("Enter an item name.");
      return;
    }

    const body: CreateItemInput = {
      name: name.trim(),
      type,
      rarity,
      description: description.trim() || undefined,
      tags: tags.trim()
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
      weight: optNum(weight),
      baseValueCp: optNum(baseValueCp),
      isMagic,
      requiresAttunement,
      stackable,
      consumable,
    };

    if (type === "WEAPON") {
      if (!damageDice.trim()) {
        toast.error("A weapon needs damage dice (e.g. 1d8).");
        return;
      }
      body.weaponCategory = weaponCategory;
      body.damageDice = damageDice.trim();
      body.damageType = damageType;
      body.versatileDamage = versatileDamage.trim() || undefined;
      body.weaponProperties =
        weaponProperties.length > 0 ? weaponProperties : undefined;
      body.rangeNormal = optNum(rangeNormal);
      body.rangeLong = optNum(rangeLong);
    } else if (type === "ARMOR") {
      const ac = optNum(baseArmorClass);
      if (ac === undefined) {
        toast.error("Armor needs a base armor class.");
        return;
      }
      body.armorCategory = armorCategory;
      body.baseArmorClass = ac;
      body.addDexToArmorClass = addDexToArmorClass;
      body.maxDexBonus = optNum(maxDexBonus);
      body.strengthRequirement = optNum(strengthRequirement);
      body.stealthDisadvantage = stealthDisadvantage;
    }

    setSubmitting(true);
    const ok = editing
      ? await patchCatalog("items", editing.id, body)
      : await postCatalog("items", body);
    setSubmitting(false);
    if (ok) {
      toast.success(editing ? "Item updated" : "Item added");
      close();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="item-name" label="Name">
          <Input
            id="item-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Field>
        <Field id="item-type" label="Type">
          {editing ? (
            <>
              <div className="border-input bg-muted/40 text-muted-foreground flex h-8 items-center rounded-md border px-2.5 text-sm">
                {TYPES[type]}
              </div>
              <p className="text-muted-foreground text-xs">
                Type is fixed after creation.
              </p>
            </>
          ) : (
            <EnumSelect
              id="item-type"
              value={type}
              onValueChange={(v) => setType(v as ItemType)}
              items={TYPES}
            />
          )}
        </Field>
        <Field id="item-rarity" label="Rarity">
          <EnumSelect
            id="item-rarity"
            value={rarity}
            onValueChange={(v) => setRarity(v as ItemRarity)}
            items={RARITIES}
          />
        </Field>
        <Field id="item-value" label="Base value (copper)">
          <Input
            id="item-value"
            type="number"
            min={0}
            value={baseValueCp}
            onChange={(e) => setBaseValueCp(e.target.value)}
            placeholder="null = priceless"
          />
        </Field>
        <Field id="item-weight" label="Weight (lb)">
          <Input
            id="item-weight"
            type="number"
            min={0}
            step="0.01"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </Field>
        <Field id="item-tags" label="Tags (comma-separated)">
          <Input
            id="item-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="thrown, silvered…"
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Checkbox label="Magic" checked={isMagic} onChange={setIsMagic} />
        <Checkbox
          label="Requires attunement"
          checked={requiresAttunement}
          onChange={setRequiresAttunement}
        />
        <Checkbox
          label="Stackable"
          checked={stackable}
          onChange={setStackable}
        />
        <Checkbox
          label="Consumable"
          checked={consumable}
          onChange={setConsumable}
        />
      </div>

      {type === "WEAPON" && (
        <fieldset className="flex flex-col gap-4 rounded-md border p-3">
          <legend className="px-1 text-xs font-medium">Weapon stats</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="weapon-category" label="Category">
              <EnumSelect
                id="weapon-category"
                value={weaponCategory}
                onValueChange={(v) => setWeaponCategory(v as WeaponCategory)}
                items={WEAPON_CATEGORIES}
              />
            </Field>
            <Field id="weapon-dice" label="Damage dice">
              <Input
                id="weapon-dice"
                value={damageDice}
                onChange={(e) => setDamageDice(e.target.value)}
                placeholder="1d8"
              />
            </Field>
            <Field id="weapon-damage-type" label="Damage type">
              <EnumSelect
                id="weapon-damage-type"
                value={damageType}
                onValueChange={(v) => setDamageType(v as DamageType)}
                items={DAMAGE_TYPES}
              />
            </Field>
            <Field id="weapon-versatile" label="Versatile damage (optional)">
              <Input
                id="weapon-versatile"
                value={versatileDamage}
                onChange={(e) => setVersatileDamage(e.target.value)}
                placeholder="1d10"
              />
            </Field>
            <Field id="weapon-range-normal" label="Range normal (ft)">
              <Input
                id="weapon-range-normal"
                type="number"
                min={0}
                value={rangeNormal}
                onChange={(e) => setRangeNormal(e.target.value)}
              />
            </Field>
            <Field id="weapon-range-long" label="Range long (ft)">
              <Input
                id="weapon-range-long"
                type="number"
                min={0}
                value={rangeLong}
                onChange={(e) => setRangeLong(e.target.value)}
              />
            </Field>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium">Properties</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {WEAPON_PROPERTIES.map((p) => (
                <Checkbox
                  key={p}
                  label={p.replace("_", " ").toLowerCase()}
                  checked={weaponProperties.includes(p)}
                  onChange={() => toggleProperty(p)}
                />
              ))}
            </div>
          </div>
        </fieldset>
      )}

      {type === "ARMOR" && (
        <fieldset className="flex flex-col gap-4 rounded-md border p-3">
          <legend className="px-1 text-xs font-medium">Armor stats</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="armor-category" label="Category">
              <EnumSelect
                id="armor-category"
                value={armorCategory}
                onValueChange={(v) => setArmorCategory(v as ArmorCategory)}
                items={ARMOR_CATEGORIES}
              />
            </Field>
            <Field id="armor-base-ac" label="Base armor class">
              <Input
                id="armor-base-ac"
                type="number"
                min={0}
                value={baseArmorClass}
                onChange={(e) => setBaseArmorClass(e.target.value)}
              />
            </Field>
            <Field id="armor-max-dex" label="Max Dex bonus (optional)">
              <Input
                id="armor-max-dex"
                type="number"
                value={maxDexBonus}
                onChange={(e) => setMaxDexBonus(e.target.value)}
              />
            </Field>
            <Field id="armor-str-req" label="Strength requirement (optional)">
              <Input
                id="armor-str-req"
                type="number"
                min={0}
                value={strengthRequirement}
                onChange={(e) => setStrengthRequirement(e.target.value)}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Checkbox
              label="Add Dex to AC"
              checked={addDexToArmorClass}
              onChange={setAddDexToArmorClass}
            />
            <Checkbox
              label="Stealth disadvantage"
              checked={stealthDisadvantage}
              onChange={setStealthDisadvantage}
            />
          </div>
        </fieldset>
      )}

      <Field id="item-desc" label="Description (optional)">
        <Textarea
          id="item-desc"
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
    <label className="flex items-center gap-2 text-sm capitalize">
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
