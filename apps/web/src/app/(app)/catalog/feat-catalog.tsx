"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CreateFeatInput, FeatCatalog } from "@dnd/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form-fields";
import { FeatDetail } from "@/components/catalog-detail";
import {
  CatalogManager,
  FormActions,
  patchCatalog,
  postCatalog,
} from "./catalog-shared";

export function FeatCatalogManager({ rows }: { rows: FeatCatalog[] }) {
  return (
    <CatalogManager
      topic="feats"
      title="Feats"
      singular="feat"
      rows={rows}
      emptyText="No feats in the catalog yet."
      renderRow={(feat) => (
        <>
          <span className="font-medium">{feat.name}</span>
          {feat.prerequisite && (
            <span className="text-muted-foreground text-xs">
              {" "}
              · requires {feat.prerequisite}
            </span>
          )}
          {feat.description && (
            <p className="text-muted-foreground truncate text-xs">
              {feat.description}
            </p>
          )}
        </>
      )}
      renderForm={({ editing, close }) => (
        <FeatForm key={editing?.id ?? "new"} editing={editing} close={close} />
      )}
      renderDetail={(feat) => <FeatDetail feat={feat} />}
    />
  );
}

function FeatForm({
  editing,
  close,
}: {
  editing: FeatCatalog | null;
  close: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [prerequisite, setPrerequisite] = useState(editing?.prerequisite ?? "");
  const [repeatable, setRepeatable] = useState(editing?.repeatable ?? false);
  const [grants, setGrants] = useState(
    editing?.grantsAbilityScoreIncrease ?? false,
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!name.trim()) {
      toast.error("Enter a feat name.");
      return;
    }
    const body: CreateFeatInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      prerequisite: prerequisite.trim() || undefined,
      repeatable,
      grantsAbilityScoreIncrease: grants,
    };
    setSubmitting(true);
    const ok = editing
      ? await patchCatalog("feats", editing.id, body)
      : await postCatalog("feats", body);
    setSubmitting(false);
    if (ok) {
      toast.success(editing ? "Feat updated" : "Feat added");
      close();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field id="feat-name" label="Name">
        <Input
          id="feat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </Field>
      <Field id="feat-prereq" label="Prerequisite (optional)">
        <Input
          id="feat-prereq"
          value={prerequisite}
          onChange={(e) => setPrerequisite(e.target.value)}
          placeholder="Strength 13 or higher…"
        />
      </Field>
      <Field id="feat-desc" label="Description (optional)">
        <Textarea
          id="feat-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </Field>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={repeatable}
            onChange={(e) => setRepeatable(e.target.checked)}
          />
          Repeatable
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={grants}
            onChange={(e) => setGrants(e.target.checked)}
          />
          Grants an ability score increase (half-feat)
        </label>
      </div>
      <FormActions
        submitting={submitting}
        editing={editing !== null}
        onCancel={close}
      />
    </form>
  );
}
