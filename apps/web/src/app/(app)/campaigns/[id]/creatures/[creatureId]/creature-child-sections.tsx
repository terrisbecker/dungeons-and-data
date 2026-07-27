"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  CreatureStatBlock,
  DamageModifierKind,
  ItemCatalog,
  SkillProficiency,
} from "@dnd/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox, EnumSelect, Field } from "@/components/form-fields";
import { DAMAGE_TYPES } from "@/components/catalog-detail";
import {
  EditableInventoryRow,
  ReadOnlyInventoryRow,
} from "@/components/inventory-rows";
import {
  CatalogHint,
  EmptyState,
  FormButtons,
  RemoveButton,
  SectionCard,
} from "@/components/section-card";
import { useLazyList } from "@/hooks/use-lazy-list";
import {
  DAMAGE_MODIFIER_KINDS,
  STAT_BLOCK_CATEGORIES,
  STAT_BLOCK_CATEGORY_ORDER,
} from "@/lib/creature-labels";
import { PROFICIENCY_ITEMS, SKILLS } from "@/lib/skills";
import { formatModifier } from "@/lib/utils";
import {
  deleteCreatureChild,
  patchCreatureChild,
  postCreatureChild,
} from "./creature-mutations";

// The creature's owned child rows: skills, damage modifiers and the stat-block
// entries (traits/actions/…). Each is an in-card add form plus per-row remove,
// mirroring the character sheet — every write goes through the BFF and then
// router.refresh(), so the server stays the single source of truth.

// --- Skills -----------------------------------------------------------------

export function SkillsSection({
  creature,
  canManage,
}: {
  creature: CreatureStatBlock;
  canManage: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const owned = new Map(creature.skills.map((s) => [s.skill, s]));
  const available = SKILLS.filter((s) => !owned.has(s.key));

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
    const ok = await postCreatureChild("creature-skills", {
      creatureId: creature.id,
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
    const ok = await deleteCreatureChild("creature-skills", id);
    if (ok) {
      toast.success("Skill proficiency removed");
      router.refresh();
    }
  }

  const skillItems: Record<string, string> = Object.fromEntries(
    available.map((s) => [s.key, `${s.label} (${s.ability})`]),
  );

  const body = (
    <ul className="grid gap-1 sm:grid-cols-2">
      {SKILLS.map((s) => {
        const row = owned.get(s.key);
        return (
          <li
            key={s.key}
            className="flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{s.label}</span>
              <span className="text-muted-foreground text-xs">{s.ability}</span>
              {row && (
                <Badge variant="secondary">
                  {PROFICIENCY_ITEMS[row.proficiency]}
                </Badge>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <span className="tabular-nums">
                {formatModifier(creature.derived.skills[s.key])}
              </span>
              {canManage && row && (
                <RemoveButton
                  onRemove={() => onRemove(row.id)}
                  confirm={`Remove proficiency in ${s.label}?`}
                />
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    );
  }

  return (
    <SectionCard
      title="Skills"
      description="Every skill shows its computed modifier; add or remove proficiencies here."
      addLabel="Add proficiency"
      formTitle="Add skill proficiency"
      open={open}
      onOpenChange={setOpen}
      form={
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {available.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              This creature is already proficient in every skill.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="creature-skill">Skill</Label>
                <EnumSelect
                  id="creature-skill"
                  value={skill}
                  onValueChange={setSkill}
                  items={skillItems}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="creature-skill-proficiency">Proficiency</Label>
                <EnumSelect
                  id="creature-skill-proficiency"
                  value={proficiency}
                  onValueChange={(v) => setProficiency(v as SkillProficiency)}
                  items={PROFICIENCY_ITEMS}
                />
              </div>
            </div>
          )}
          <FormButtons
            submitting={submitting}
            onCancel={() => setOpen(false)}
          />
        </form>
      }
    >
      {body}
    </SectionCard>
  );
}

// --- Damage modifiers -------------------------------------------------------

const ANY_DAMAGE = "ANY";

export function DamageModifiersSection({
  creature,
  canManage,
}: {
  creature: CreatureStatBlock;
  canManage: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [kind, setKind] = useState<DamageModifierKind>("RESISTANCE");
  const [damageType, setDamageType] = useState<string>(ANY_DAMAGE);
  const [note, setNote] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const ok = await postCreatureChild("creature-damage-modifiers", {
      creatureId: creature.id,
      kind,
      damageType: damageType === ANY_DAMAGE ? null : damageType,
      note: note.trim() || null,
    });
    setSubmitting(false);
    if (ok) {
      toast.success("Damage modifier added");
      setKind("RESISTANCE");
      setDamageType(ANY_DAMAGE);
      setNote("");
      setOpen(false);
      router.refresh();
    }
  }

  async function onRemove(id: string) {
    const ok = await deleteCreatureChild("creature-damage-modifiers", id);
    if (ok) {
      toast.success("Damage modifier removed");
      router.refresh();
    }
  }

  const rows =
    creature.damageModifiers.length === 0 ? (
      <EmptyState text="No vulnerabilities, resistances or immunities." />
    ) : (
      <ul className="flex flex-col gap-1">
        {creature.damageModifiers.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Badge variant="outline">{DAMAGE_MODIFIER_KINDS[row.kind]}</Badge>
              <span className="truncate">
                {row.damageType ? DAMAGE_TYPES[row.damageType] : "All damage"}
              </span>
              {row.note && (
                <span className="text-muted-foreground truncate text-xs">
                  {row.note}
                </span>
              )}
            </span>
            {canManage && (
              <RemoveButton
                onRemove={() => onRemove(row.id)}
                confirm={`Remove this ${DAMAGE_MODIFIER_KINDS[row.kind].toLowerCase()}?`}
              />
            )}
          </li>
        ))}
      </ul>
    );

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Damage Modifiers</CardTitle>
        </CardHeader>
        <CardContent>{rows}</CardContent>
      </Card>
    );
  }

  return (
    <SectionCard
      title="Damage Modifiers"
      description="Vulnerabilities, resistances and immunities. Leave the damage type blank for a blanket rule."
      addLabel="Add modifier"
      formTitle="Add damage modifier"
      open={open}
      onOpenChange={setOpen}
      form={
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="modifier-kind">Kind</Label>
              <EnumSelect
                id="modifier-kind"
                value={kind}
                onValueChange={(v) => setKind(v as DamageModifierKind)}
                items={DAMAGE_MODIFIER_KINDS}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="modifier-damage-type">Damage type</Label>
              <EnumSelect
                id="modifier-damage-type"
                value={damageType}
                onValueChange={setDamageType}
                items={{ [ANY_DAMAGE]: "All damage", ...DAMAGE_TYPES }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="modifier-note">Note</Label>
              <Input
                id="modifier-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="from nonmagical attacks"
              />
            </div>
          </div>
          <FormButtons
            submitting={submitting}
            onCancel={() => setOpen(false)}
          />
        </form>
      }
    >
      {rows}
    </SectionCard>
  );
}

// --- Stat block entries -----------------------------------------------------

type Entry = CreatureStatBlock["entries"][number];

function EntryForm({
  creatureId,
  editing,
  close,
}: {
  creatureId: string;
  editing: Entry | null;
  close: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<string>(
    editing?.category ?? "TRAIT",
  );
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(editing?.sortOrder ?? 0));
  const [legendaryCost, setLegendaryCost] = useState(
    editing?.legendaryCost === null || editing?.legendaryCost === undefined
      ? ""
      : String(editing.legendaryCost),
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!name.trim()) {
      toast.error("Give the entry a name.");
      return;
    }
    if (!description.trim()) {
      toast.error("Enter the entry's text.");
      return;
    }
    const order = Number(sortOrder.trim() === "" ? 0 : sortOrder);
    if (!Number.isInteger(order) || order < 0) {
      toast.error("Order must be a whole number, 0 or more.");
      return;
    }
    const cost = legendaryCost.trim() === "" ? null : Number(legendaryCost);
    if (cost !== null && (!Number.isInteger(cost) || cost < 0)) {
      toast.error("Legendary cost must be a whole number, 0 or more.");
      return;
    }

    const body = {
      category,
      name: name.trim(),
      description: description.trim(),
      sortOrder: order,
      legendaryCost: cost,
    };

    setSubmitting(true);
    const ok = editing
      ? await patchCreatureChild("stat-block-entries", editing.id, body)
      : await postCreatureChild("stat-block-entries", {
          creatureId,
          ...body,
        });
    setSubmitting(false);
    if (ok) {
      toast.success(editing ? "Entry updated" : "Entry added");
      close();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="entry-category">Category</Label>
          <EnumSelect
            id="entry-category"
            value={category}
            onValueChange={setCategory}
            items={STAT_BLOCK_CATEGORIES}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="entry-name">Name</Label>
          <Input
            id="entry-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Multiattack, Fire Breath…"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="entry-order">Order</Label>
          <Input
            id="entry-order"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="entry-description">Text</Label>
        <Textarea
          id="entry-description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Monster Manual prose, exactly as you'd read it aloud."
        />
      </div>
      <div className="flex flex-col gap-2 sm:max-w-48">
        <Label htmlFor="entry-legendary-cost">Legendary cost (optional)</Label>
        <Input
          id="entry-legendary-cost"
          type="number"
          min={0}
          value={legendaryCost}
          onChange={(e) => setLegendaryCost(e.target.value)}
          placeholder="2"
        />
      </div>
      <FormButtons
        submitting={submitting}
        onCancel={close}
        submitLabel={editing ? "Save" : "Add"}
        pendingLabel={editing ? "Saving…" : "Adding…"}
      />
    </form>
  );
}

export function StatBlockEntriesSection({
  creature,
  canManage,
}: {
  creature: CreatureStatBlock;
  canManage: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = creature.entries.find((e) => e.id === editingId) ?? null;
  const open = adding || editing !== null;

  function close() {
    setAdding(false);
    setEditingId(null);
  }

  async function onRemove(id: string) {
    const ok = await deleteCreatureChild("stat-block-entries", id);
    if (ok) {
      toast.success("Entry removed");
      router.refresh();
    }
  }

  const body =
    creature.entries.length === 0 ? (
      <EmptyState text="No traits or actions yet." />
    ) : (
      <div className="flex flex-col gap-4">
        {STAT_BLOCK_CATEGORY_ORDER.map((category) => {
          const entries = creature.entries.filter(
            (entry) => entry.category === category,
          );
          if (entries.length === 0) return null;
          return (
            <section key={category} className="flex flex-col gap-2">
              <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {STAT_BLOCK_CATEGORIES[category]}
              </h3>
              <ul className="flex flex-col gap-2">
                {entries.map((entry) => (
                  <li key={entry.id} className="rounded-md border px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">
                        {entry.name}
                        {entry.legendaryCost !== null && (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            (costs {entry.legendaryCost} actions)
                          </span>
                        )}
                      </p>
                      {canManage && (
                        <span className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAdding(false);
                              setEditingId(entry.id);
                            }}
                          >
                            Edit
                          </Button>
                          <RemoveButton
                            onRemove={() => onRemove(entry.id)}
                            confirm={`Remove ${entry.name}?`}
                          />
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {entry.description}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    );

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traits &amp; Actions</CardTitle>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    );
  }

  return (
    <SectionCard
      title="Traits & Actions"
      description="Free-text stat block prose, grouped the way a Monster Manual entry reads."
      addLabel="Add entry"
      formTitle={editing ? `Edit ${editing.name}` : "Add stat block entry"}
      open={open}
      onOpenChange={(next) => (next ? setAdding(true) : close())}
      form={
        // Remounted per row so the form's useState seeds re-run on the new entry.
        <EntryForm
          key={editing?.id ?? "new"}
          creatureId={creature.id}
          editing={editing}
          close={close}
        />
      }
    >
      {body}
    </SectionCard>
  );
}

// --- Inventory ---------------------------------------------------------------

// The rows themselves live in components/inventory-rows.tsx — the character
// sheet renders the identical thing against the same endpoint.

const patchInventory = (id: string, body: unknown) =>
  patchCreatureChild("inventory-items", id, body);

export function InventorySection({
  creature,
  canManage,
}: {
  creature: CreatureStatBlock;
  canManage: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { rows, loading, load } = useLazyList<ItemCatalog>(
    "/api/catalog/items",
    "Could not load catalog",
  );

  // The picker defaults to the first catalog row until the user changes it.
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [equipped, setEquipped] = useState(false);
  const [attuned, setAttuned] = useState(false);

  const selectedItem = itemId || rows?.[0]?.id || "";

  function onToggle(next: boolean) {
    setOpen(next);
    if (next) load();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!selectedItem) {
      toast.error("Pick an item.");
      return;
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      toast.error("Quantity must be ≥ 1.");
      return;
    }
    setSubmitting(true);
    const ok = await postCreatureChild("inventory-items", {
      creatureId: creature.id,
      itemId: selectedItem,
      quantity: qty,
      equipped,
      attuned,
    });
    setSubmitting(false);
    if (ok) {
      toast.success("Item added");
      setOpen(false);
      setQuantity("1");
      setEquipped(false);
      setAttuned(false);
      router.refresh();
    }
  }

  async function onRemove(id: string) {
    const ok = await deleteCreatureChild("inventory-items", id);
    if (ok) {
      toast.success("Item removed");
      router.refresh();
    }
  }

  const items: Record<string, string> = rows
    ? Object.fromEntries(rows.map((i) => [i.id, i.name]))
    : {};

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {creature.inventory.length === 0 ? (
            <EmptyState text="No items yet." />
          ) : (
            <ul className="flex flex-col gap-1">
              {creature.inventory.map((row) => (
                <ReadOnlyInventoryRow key={row.id} row={row} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <SectionCard
      title="Inventory"
      description="Loot and gear this creature carries (max 3 attuned)."
      addLabel="Add item"
      formTitle="Add item"
      open={open}
      onOpenChange={onToggle}
      form={
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <CatalogHint
            loading={loading && !rows}
            empty={!!rows && rows.length === 0}
            noun="items"
          />
          {rows && rows.length > 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="creature-inv-item" label="Item">
                  <EnumSelect
                    id="creature-inv-item"
                    value={selectedItem}
                    onValueChange={setItemId}
                    items={items}
                  />
                </Field>
                <Field id="creature-inv-qty" label="Quantity">
                  <Input
                    id="creature-inv-qty"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <Checkbox
                  label="Equipped"
                  checked={equipped}
                  onChange={setEquipped}
                />
                <Checkbox
                  label="Attuned"
                  checked={attuned}
                  onChange={setAttuned}
                />
              </div>
            </>
          )}
          <FormButtons
            submitting={submitting}
            onCancel={() => setOpen(false)}
          />
        </form>
      }
    >
      {creature.inventory.length === 0 ? (
        <EmptyState text="No items yet." />
      ) : (
        <ul className="flex flex-col gap-1">
          {creature.inventory.map((row) => (
            <EditableInventoryRow
              key={row.id}
              row={row}
              patch={patchInventory}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
