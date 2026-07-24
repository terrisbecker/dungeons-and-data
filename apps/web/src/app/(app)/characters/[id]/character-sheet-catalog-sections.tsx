"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  CharacterSheet,
  FeatCatalog,
  FeatureCatalog,
  ItemCatalog,
  SpellCatalog,
} from "@dnd/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EnumSelect, Field } from "@/components/form-fields";
import {
  EmptyState,
  FormButtons,
  RemoveButton,
  SectionCard,
  deleteChild,
  postChild,
} from "./character-sheet-sections";

// --- Shared helpers --------------------------------------------------------

// Composite-key detach for the spell/feat/feature joins (characterId + catalog
// id). Inventory items use the single-id deleteChild() instead.
async function deleteJoin(
  topic: string,
  characterId: string,
  otherId: string,
): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/character-children/${topic}/${characterId}/${otherId}`,
      { method: "DELETE" },
    );
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

// Lazy-loads a catalog the first time a section opens, so viewing a sheet
// doesn't fetch every catalog up front.
function useLazyCatalog<T>(topic: string) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(false);
  const startedRef = useRef(false);

  // Fires at most once (per mount), so re-opening the section doesn't refetch.
  const load = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/catalog/${topic}`);
      if (res.ok) {
        setRows((await res.json()) as T[]);
      } else {
        toast.error("Could not load catalog");
        setRows([]);
      }
    } catch {
      toast.error("Could not reach the server");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [topic]);

  return { rows, loading, load };
}

const CHECKBOX = "accent-primary size-4";

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
        className={CHECKBOX}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

// Shared empty/loading hint shown inside a picker form.
function CatalogHint({
  loading,
  empty,
  noun,
}: {
  loading: boolean;
  empty: boolean;
  noun: string;
}) {
  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading catalog…</p>;
  }
  if (empty) {
    return (
      <p className="text-muted-foreground text-sm">
        No {noun} in the catalog yet — a DM can add them under Catalogs.
      </p>
    );
  }
  return null;
}

// --- Inventory -------------------------------------------------------------

export function InventorySection({
  characterId,
  inventory,
}: {
  characterId: string;
  inventory: CharacterSheet["inventory"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { rows, loading, load } = useLazyCatalog<ItemCatalog>("items");

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
    const ok = await postChild("inventory-items", {
      characterId,
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
    const ok = await deleteChild("inventory-items", id);
    if (ok) {
      toast.success("Item removed");
      router.refresh();
    }
  }

  const items = useMemo<Record<string, string>>(
    () => (rows ? Object.fromEntries(rows.map((i) => [i.id, i.name])) : {}),
    [rows],
  );

  return (
    <SectionCard
      title="Inventory"
      description="Items carried by this character (max 3 attuned)."
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
                <Field id="inv-item" label="Item">
                  <EnumSelect
                    id="inv-item"
                    value={selectedItem}
                    onValueChange={setItemId}
                    items={items}
                  />
                </Field>
                <Field id="inv-qty" label="Quantity">
                  <Input
                    id="inv-qty"
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
      {inventory.length === 0 ? (
        <EmptyState text="No items yet." />
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {inventory.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <span>
                {row.item.name}
                {row.quantity > 1 && (
                  <span className="text-muted-foreground">
                    {" "}
                    ×{row.quantity}
                  </span>
                )}
                <span className="text-muted-foreground ml-1 text-xs">
                  {[
                    row.equipped ? "equipped" : null,
                    row.attuned ? "attuned" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <RemoveButton onRemove={() => onRemove(row.id)} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// --- Spells ----------------------------------------------------------------

export function SpellsSection({
  characterId,
  spells,
}: {
  characterId: string;
  spells: CharacterSheet["spells"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { rows, loading, load } = useLazyCatalog<SpellCatalog>("spells");

  const [spellId, setSpellId] = useState("");
  const [known, setKnown] = useState(true);
  const [prepared, setPrepared] = useState(false);
  const [alwaysPrepared, setAlwaysPrepared] = useState(false);
  const [sourceClass, setSourceClass] = useState("");

  const selectedSpell = spellId || rows?.[0]?.id || "";

  function onToggle(next: boolean) {
    setOpen(next);
    if (next) load();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!selectedSpell) {
      toast.error("Pick a spell.");
      return;
    }
    setSubmitting(true);
    const ok = await postChild("character-spells", {
      characterId,
      spellId: selectedSpell,
      known,
      prepared,
      alwaysPrepared,
      sourceClass: sourceClass.trim() || null,
    });
    setSubmitting(false);
    if (ok) {
      toast.success("Spell added");
      setOpen(false);
      setSourceClass("");
      router.refresh();
    }
  }

  async function onRemove(id: string) {
    const ok = await deleteJoin("character-spells", characterId, id);
    if (ok) {
      toast.success("Spell removed");
      router.refresh();
    }
  }

  const items = useMemo<Record<string, string>>(
    () =>
      rows
        ? Object.fromEntries(
            rows.map((s) => [
              s.id,
              `${s.name} (${s.level === 0 ? "Cantrip" : `Lvl ${s.level}`})`,
            ]),
          )
        : {},
    [rows],
  );

  return (
    <SectionCard
      title="Spells"
      description="Known and prepared spells."
      addLabel="Add spell"
      formTitle="Add spell"
      open={open}
      onOpenChange={onToggle}
      form={
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <CatalogHint
            loading={loading && !rows}
            empty={!!rows && rows.length === 0}
            noun="spells"
          />
          {rows && rows.length > 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="spell-pick" label="Spell">
                  <EnumSelect
                    id="spell-pick"
                    value={selectedSpell}
                    onValueChange={setSpellId}
                    items={items}
                  />
                </Field>
                <Field id="spell-source" label="Source class (optional)">
                  <Input
                    id="spell-source"
                    value={sourceClass}
                    onChange={(e) => setSourceClass(e.target.value)}
                    placeholder="Wizard…"
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <Checkbox label="Known" checked={known} onChange={setKnown} />
                <Checkbox
                  label="Prepared"
                  checked={prepared}
                  onChange={setPrepared}
                />
                <Checkbox
                  label="Always prepared"
                  checked={alwaysPrepared}
                  onChange={setAlwaysPrepared}
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
      {spells.length === 0 ? (
        <EmptyState text="No spells yet." />
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {spells.map((s) => (
            <li
              key={s.spell.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <span>
                {s.spell.name}
                <span className="text-muted-foreground ml-1 text-xs">
                  {s.spell.level === 0 ? "Cantrip" : `Lvl ${s.spell.level}`}
                  {s.prepared ? " · prepared" : ""}
                </span>
              </span>
              <RemoveButton onRemove={() => onRemove(s.spell.id)} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// --- Feats -----------------------------------------------------------------

export function FeatsSection({
  characterId,
  feats,
}: {
  characterId: string;
  feats: CharacterSheet["feats"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { rows, loading, load } = useLazyCatalog<FeatCatalog>("feats");
  const [featId, setFeatId] = useState("");

  const selectedFeat = featId || rows?.[0]?.id || "";

  function onToggle(next: boolean) {
    setOpen(next);
    if (next) load();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!selectedFeat) {
      toast.error("Pick a feat.");
      return;
    }
    setSubmitting(true);
    const ok = await postChild("character-feats", {
      characterId,
      featId: selectedFeat,
    });
    setSubmitting(false);
    if (ok) {
      toast.success("Feat added");
      setOpen(false);
      router.refresh();
    }
  }

  async function onRemove(id: string) {
    const ok = await deleteJoin("character-feats", characterId, id);
    if (ok) {
      toast.success("Feat removed");
      router.refresh();
    }
  }

  const items = useMemo<Record<string, string>>(
    () => (rows ? Object.fromEntries(rows.map((f) => [f.id, f.name])) : {}),
    [rows],
  );

  return (
    <SectionCard
      title="Feats"
      description="Feats this character has taken."
      addLabel="Add feat"
      formTitle="Add feat"
      open={open}
      onOpenChange={onToggle}
      form={
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <CatalogHint
            loading={loading && !rows}
            empty={!!rows && rows.length === 0}
            noun="feats"
          />
          {rows && rows.length > 0 && (
            <Field id="feat-pick" label="Feat">
              <EnumSelect
                id="feat-pick"
                value={selectedFeat}
                onValueChange={setFeatId}
                items={items}
              />
            </Field>
          )}
          <FormButtons
            submitting={submitting}
            onCancel={() => setOpen(false)}
          />
        </form>
      }
    >
      {feats.length === 0 ? (
        <EmptyState text="No feats yet." />
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {feats.map((f) => (
            <li
              key={f.feat.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <span>
                <span className="font-medium">{f.feat.name}</span>
                {f.feat.description && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {f.feat.description}
                  </span>
                )}
              </span>
              <RemoveButton onRemove={() => onRemove(f.feat.id)} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// --- Features --------------------------------------------------------------

export function FeaturesSection({
  characterId,
  features,
}: {
  characterId: string;
  features: CharacterSheet["features"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { rows, loading, load } = useLazyCatalog<FeatureCatalog>("features");
  const [featureId, setFeatureId] = useState("");
  const [notes, setNotes] = useState("");

  const selectedFeature = featureId || rows?.[0]?.id || "";

  function onToggle(next: boolean) {
    setOpen(next);
    if (next) load();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!selectedFeature) {
      toast.error("Pick a feature.");
      return;
    }
    setSubmitting(true);
    const ok = await postChild("character-features", {
      characterId,
      featureId: selectedFeature,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (ok) {
      toast.success("Feature added");
      setOpen(false);
      setNotes("");
      router.refresh();
    }
  }

  async function onRemove(id: string) {
    const ok = await deleteJoin("character-features", characterId, id);
    if (ok) {
      toast.success("Feature removed");
      router.refresh();
    }
  }

  const items = useMemo<Record<string, string>>(
    () =>
      rows
        ? Object.fromEntries(
            rows.map((f) => [
              f.id,
              `${f.name}${f.subtype ? ` (${f.subtype})` : ""}`,
            ]),
          )
        : {},
    [rows],
  );

  return (
    <SectionCard
      title="Features"
      description="Class, subclass, racial, and background features."
      addLabel="Add feature"
      formTitle="Add feature"
      open={open}
      onOpenChange={onToggle}
      form={
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <CatalogHint
            loading={loading && !rows}
            empty={!!rows && rows.length === 0}
            noun="features"
          />
          {rows && rows.length > 0 && (
            <>
              <Field id="feature-pick" label="Feature">
                <EnumSelect
                  id="feature-pick"
                  value={selectedFeature}
                  onValueChange={setFeatureId}
                  items={items}
                />
              </Field>
              <div className="flex flex-col gap-2">
                <Label htmlFor="feature-notes">Notes (optional)</Label>
                <Textarea
                  id="feature-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
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
      {features.length === 0 ? (
        <EmptyState text="No features yet." />
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {features.map((f) => (
            <li
              key={f.feature.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <span>
                {f.feature.name}
                <span className="text-muted-foreground ml-1 text-xs">
                  {f.feature.source}
                </span>
              </span>
              <RemoveButton onRemove={() => onRemove(f.feature.id)} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
