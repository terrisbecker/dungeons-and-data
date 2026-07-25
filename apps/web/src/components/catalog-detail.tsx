"use client";

import type {
  FeatCatalog,
  FeatureCatalog,
  FeatureSource,
  ItemCatalog,
  SpellCatalog,
} from "@dnd/shared";

// Detail renderers for the four shared catalogs, plus the layout blocks they are
// built from. Two callers: the /catalog browsers (in their row popovers) and the
// character sheet, whose joined rows carry these exact catalog types because the
// sheet select reuses the catalog projections. Keep them presentational — no
// fetching, no state — so either side can drop them into a popover.

// --- Layout blocks ----------------------------------------------------------

export function DetailHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-2">
      <p className="text-sm leading-tight font-medium">{title}</p>
      {subtitle ? (
        <p className="text-muted-foreground text-xs">{subtitle}</p>
      ) : null}
    </div>
  );
}

// A label/value line; renders nothing when the value is empty so callers can
// list every possible field without guarding each one.
export function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === false
  ) {
    return null;
  }
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="min-w-0 text-right break-words">{value}</span>
    </div>
  );
}

export function DetailBody({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>;
}

export function DetailText({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <p className="text-muted-foreground mt-2 border-t pt-2 whitespace-pre-wrap">
      {text}
    </p>
  );
}

// --- Enum label maps --------------------------------------------------------

export const ITEM_TYPES: Record<string, string> = {
  ADVENTURING_GEAR: "Adventuring gear",
  WEAPON: "Weapon",
  ARMOR: "Armor / shield",
  AMMUNITION: "Ammunition",
  POTION: "Potion",
  SCROLL: "Scroll",
  WAND: "Wand",
  ROD: "Rod",
  STAFF: "Staff",
  RING: "Ring",
  WONDROUS_ITEM: "Wondrous item",
  TOOL: "Tool",
  FOOD_AND_DRINK: "Food & drink",
  TRADE_GOOD: "Trade good",
  CONTAINER: "Container",
  MOUNT_OR_VEHICLE: "Mount / vehicle",
  TREASURE: "Treasure",
  OTHER: "Other",
};

export const ITEM_RARITIES: Record<string, string> = {
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  VERY_RARE: "Very rare",
  LEGENDARY: "Legendary",
  ARTIFACT: "Artifact",
};

export const WEAPON_CATEGORIES: Record<string, string> = {
  SIMPLE: "Simple",
  MARTIAL: "Martial",
};

export const ARMOR_CATEGORIES: Record<string, string> = {
  LIGHT: "Light",
  MEDIUM: "Medium",
  HEAVY: "Heavy",
  SHIELD: "Shield",
};

export const DAMAGE_TYPES: Record<string, string> = {
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

export const SPELL_SCHOOLS: Record<string, string> = {
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

export const SAVE_ABILITIES: Record<string, string> = {
  NONE: "None",
  STR: "Strength",
  DEX: "Dexterity",
  CON: "Constitution",
  INT: "Intelligence",
  WIS: "Wisdom",
  CHA: "Charisma",
};

export const FEATURE_SOURCES: Record<FeatureSource, string> = {
  RACE: "Race",
  CLASS: "Class",
  SUBCLASS: "Subclass",
  BACKGROUND: "Background",
  FEAT: "Feat",
};

// --- Per-catalog detail bodies ----------------------------------------------

export function ItemDetail({ item }: { item: ItemCatalog }) {
  const flags = [
    item.isMagic ? "Magic" : null,
    item.requiresAttunement ? "Attunement" : null,
    item.stackable ? "Stackable" : null,
    item.consumable ? "Consumable" : null,
  ].filter(Boolean);

  return (
    <>
      <DetailHeader
        title={item.name}
        subtitle={`${ITEM_TYPES[item.type]} · ${ITEM_RARITIES[item.rarity]}`}
      />
      <DetailBody>
        <DetailRow
          label="Value"
          value={
            item.baseValueCp != null ? `${item.baseValueCp} cp` : "Priceless"
          }
        />
        <DetailRow
          label="Weight"
          value={item.weight != null ? `${item.weight} lb` : null}
        />
        <DetailRow
          label="Tags"
          value={
            item.tags && item.tags.length > 0 ? item.tags.join(", ") : null
          }
        />
        <DetailRow
          label=""
          value={flags.length > 0 ? flags.join(" · ") : null}
        />

        {item.type === "WEAPON" && (
          <>
            <DetailRow
              label="Category"
              value={
                item.weaponCategory
                  ? WEAPON_CATEGORIES[item.weaponCategory]
                  : null
              }
            />
            <DetailRow
              label="Damage"
              value={
                item.damageDice
                  ? `${item.damageDice}${
                      item.damageType
                        ? ` ${DAMAGE_TYPES[item.damageType].toLowerCase()}`
                        : ""
                    }`
                  : null
              }
            />
            <DetailRow label="Versatile" value={item.versatileDamage} />
            <DetailRow
              label="Range"
              value={
                item.rangeNormal != null
                  ? `${item.rangeNormal}${
                      item.rangeLong != null ? `/${item.rangeLong}` : ""
                    } ft`
                  : null
              }
            />
            <DetailRow
              label="Properties"
              value={
                item.weaponProperties && item.weaponProperties.length > 0
                  ? item.weaponProperties
                      .map((p) => p.replace("_", " ").toLowerCase())
                      .join(", ")
                  : null
              }
            />
          </>
        )}

        {item.type === "ARMOR" && (
          <>
            <DetailRow
              label="Category"
              value={
                item.armorCategory ? ARMOR_CATEGORIES[item.armorCategory] : null
              }
            />
            <DetailRow
              label="Base AC"
              value={
                item.baseArmorClass != null
                  ? `${item.baseArmorClass}${
                      item.addDexToArmorClass
                        ? ` + Dex${
                            item.maxDexBonus != null
                              ? ` (max ${item.maxDexBonus})`
                              : ""
                          }`
                        : ""
                    }`
                  : null
              }
            />
            <DetailRow label="Str req" value={item.strengthRequirement} />
            <DetailRow
              label="Stealth"
              value={item.stealthDisadvantage ? "Disadvantage" : null}
            />
          </>
        )}
      </DetailBody>
      <DetailText text={item.description} />
    </>
  );
}

export function SpellDetail({ spell }: { spell: SpellCatalog }) {
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
        }${spell.school ? ` · ${SPELL_SCHOOLS[spell.school]}` : ""}`}
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
          value={spell.savingThrow ? SAVE_ABILITIES[spell.savingThrow] : null}
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

export function FeatDetail({ feat }: { feat: FeatCatalog }) {
  return (
    <>
      <DetailHeader title={feat.name} />
      <DetailBody>
        <DetailRow label="Prerequisite" value={feat.prerequisite} />
        <DetailRow label="Repeatable" value={feat.repeatable ? "Yes" : null} />
        <DetailRow
          label="Half-feat"
          value={
            feat.grantsAbilityScoreIncrease ? "Grants +1 ability score" : null
          }
        />
      </DetailBody>
      <DetailText text={feat.description} />
    </>
  );
}

export function FeatureDetail({ feature }: { feature: FeatureCatalog }) {
  return (
    <>
      <DetailHeader
        title={feature.name}
        subtitle={FEATURE_SOURCES[feature.source]}
      />
      <DetailBody>
        <DetailRow label="Subtype" value={feature.subtype} />
        <DetailRow
          label="Level"
          value={feature.level != null ? feature.level : null}
        />
      </DetailBody>
      <DetailText text={feature.description} />
    </>
  );
}
