"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  CreateFeatureInput,
  FeatureCatalog,
  FeatureSource,
} from "@dnd/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EnumSelect, Field } from "@/components/form-fields";
import {
  FEATURE_SOURCES as SOURCES,
  FeatureDetail,
} from "@/components/catalog-detail";
import {
  ALL_FILTER,
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

// Subtype/level have no fixed enum (free-text/nullable), so their filter
// options are derived from whatever values are actually present in `rows`.
const NONE_VALUE = "__none__";

export function FeatureCatalogManager({ rows }: { rows: FeatureCatalog[] }) {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState(ALL_FILTER);
  const [subtype, setSubtype] = useState(ALL_FILTER);
  const [level, setLevel] = useState(ALL_FILTER);

  const subtypeItems = useMemo(() => {
    const values = Array.from(
      new Set(rows.map((r) => r.subtype).filter((s): s is string => !!s)),
    ).sort();
    const items = withAll(
      Object.fromEntries(values.map((v) => [v, v])),
      "All subtypes",
    );
    if (rows.some((r) => !r.subtype)) items[NONE_VALUE] = "(none)";
    return items;
  }, [rows]);

  const levelItems = useMemo(() => {
    const values = Array.from(
      new Set(rows.map((r) => r.level).filter((l): l is number => l != null)),
    ).sort((a, b) => a - b);
    const items = withAll(
      Object.fromEntries(values.map((v) => [String(v), `Level ${v}`])),
      "All levels",
    );
    if (rows.some((r) => r.level == null)) items[NONE_VALUE] = "(none)";
    return items;
  }, [rows]);

  const rowFilter = useCallback(
    (feature: FeatureCatalog) => {
      if (!matchesName(feature.name, search)) return false;
      if (source !== ALL_FILTER && feature.source !== source) return false;
      if (subtype !== ALL_FILTER) {
        if (subtype === NONE_VALUE) {
          if (feature.subtype) return false;
        } else if (feature.subtype !== subtype) return false;
      }
      if (level !== ALL_FILTER) {
        if (level === NONE_VALUE) {
          if (feature.level != null) return false;
        } else if (String(feature.level) !== level) return false;
      }
      return true;
    },
    [search, source, subtype, level],
  );

  const toolbar = (
    <FilterBar>
      <CatalogSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search features by name…"
      />
      <EnumSelect
        value={source}
        onValueChange={setSource}
        items={withAll(SOURCES, "All sources")}
      />
      <EnumSelect
        value={subtype}
        onValueChange={setSubtype}
        items={subtypeItems}
      />
      <EnumSelect value={level} onValueChange={setLevel} items={levelItems} />
    </FilterBar>
  );

  return (
    <CatalogManager
      topic="features"
      title="Features"
      singular="feature"
      rows={rows}
      emptyText="No features in the catalog yet."
      toolbar={toolbar}
      rowFilter={rowFilter}
      renderRow={(feature) => (
        <>
          <span className="font-medium">{feature.name}</span>
          <span className="text-muted-foreground text-xs">
            {" "}
            · {SOURCES[feature.source]}
            {feature.subtype ? ` (${feature.subtype})` : ""}
            {feature.level != null ? ` · Lvl ${feature.level}` : ""}
          </span>
        </>
      )}
      renderForm={({ editing, close }) => (
        <FeatureForm
          key={editing?.id ?? "new"}
          editing={editing}
          close={close}
        />
      )}
      renderDetail={(feature) => <FeatureDetail feature={feature} />}
    />
  );
}

function FeatureForm({
  editing,
  close,
}: {
  editing: FeatureCatalog | null;
  close: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(editing?.name ?? "");
  const [source, setSource] = useState<FeatureSource>(
    editing?.source ?? "CLASS",
  );
  const [subtype, setSubtype] = useState(editing?.subtype ?? "");
  const [level, setLevel] = useState(
    editing?.level != null ? String(editing.level) : "",
  );
  const [description, setDescription] = useState(editing?.description ?? "");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!name.trim()) {
      toast.error("Enter a feature name.");
      return;
    }
    let levelValue: number | undefined;
    if (level.trim() !== "") {
      const n = Number(level);
      if (!Number.isFinite(n) || n < 1 || n > 20) {
        toast.error("Level must be between 1 and 20.");
        return;
      }
      levelValue = n;
    }
    const body: CreateFeatureInput = {
      name: name.trim(),
      source,
      subtype: subtype.trim() || undefined,
      level: levelValue,
      description: description.trim() || undefined,
    };
    setSubmitting(true);
    const ok = editing
      ? await patchCatalog("features", editing.id, body)
      : await postCatalog("features", body);
    setSubmitting(false);
    if (ok) {
      toast.success(editing ? "Feature updated" : "Feature added");
      close();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="feature-name" label="Name">
          <Input
            id="feature-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Field>
        <Field id="feature-source" label="Source">
          <EnumSelect
            id="feature-source"
            value={source}
            onValueChange={(v) => setSource(v as FeatureSource)}
            items={SOURCES}
          />
        </Field>
        <Field id="feature-subtype" label="Subtype (optional)">
          <Input
            id="feature-subtype"
            value={subtype}
            onChange={(e) => setSubtype(e.target.value)}
            placeholder="Wizard, School of Evocation…"
          />
        </Field>
        <Field id="feature-level" label="Level (optional)">
          <Input
            id="feature-level"
            type="number"
            min={1}
            max={20}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          />
        </Field>
      </div>
      <Field id="feature-desc" label="Description (optional)">
        <Textarea
          id="feature-desc"
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
