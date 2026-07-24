"use client";

import { useState } from "react";
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
  CatalogManager,
  DetailBody,
  DetailHeader,
  DetailRow,
  DetailText,
  FormActions,
  patchCatalog,
  postCatalog,
} from "./catalog-shared";

const SOURCES: Record<FeatureSource, string> = {
  RACE: "Race",
  CLASS: "Class",
  SUBCLASS: "Subclass",
  BACKGROUND: "Background",
  FEAT: "Feat",
};

export function FeatureCatalogManager({ rows }: { rows: FeatureCatalog[] }) {
  return (
    <CatalogManager
      topic="features"
      title="Features"
      singular="feature"
      rows={rows}
      emptyText="No features in the catalog yet."
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
      renderDetail={(feature) => (
        <>
          <DetailHeader
            title={feature.name}
            subtitle={SOURCES[feature.source]}
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
      )}
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
