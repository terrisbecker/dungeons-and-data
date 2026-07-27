"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import type {
  CreateLocationInput,
  LocationRow,
  UpdateLocationInput,
} from "@dnd/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EnumSelect, Field } from "@/components/form-fields";
import { descendantIdsOf, indexLocations, pathLabel } from "./location-tree";

// `type` is deliberately free text (homebrew stays open), so this is a datalist
// of suggestions on a plain input rather than a closed select.
const TYPE_SUGGESTIONS = [
  "realm",
  "region",
  "territory",
  "city",
  "town",
  "village",
  "building",
  "dungeon",
  "wilderness",
];

// "Top level" is the sentinel for parentId = null; uuids can never collide.
const NO_PARENT = "NONE";

// One dialog for both create and edit. The parent picker is built from the
// campaign's full location list, minus the location being edited and everything
// under it — the API rejects those as cycles, so they are never offered.
export function LocationFormDialog({
  campaignId,
  all,
  editing,
  defaultParentId,
}: {
  campaignId: string;
  all: LocationRow[];
  editing?: LocationRow;
  defaultParentId?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const seedParent =
    (editing ? editing.parentId : (defaultParentId ?? null)) ?? NO_PARENT;
  const [locationName, setLocationName] = useState(editing?.locationName ?? "");
  const [type, setType] = useState(editing?.type ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [parent, setParent] = useState(seedParent);

  const index = indexLocations(all);
  const blocked = editing
    ? descendantIdsOf(editing.id, all)
    : new Set<string>();
  const parentItems: Record<string, string> = { [NO_PARENT]: "Top level" };
  for (const row of all
    .filter((row) => !blocked.has(row.id))
    .sort((a, b) => pathLabel(a, index).localeCompare(pathLabel(b, index)))) {
    parentItems[row.id] = pathLabel(row, index);
  }

  const suggestions = [
    ...new Set([...TYPE_SUGGESTIONS, ...all.map((row) => row.type)]),
  ].sort();

  function onOpenChange(next: boolean) {
    // Re-seed on every open so a cancelled edit doesn't linger.
    if (next) {
      setLocationName(editing?.locationName ?? "");
      setType(editing?.type ?? "");
      setDescription(editing?.description ?? "");
      setParent(seedParent);
    }
    setOpen(next);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const name = locationName.trim();
    if (!name) {
      toast.error("Enter a location name.");
      return;
    }
    const kind = type.trim();
    if (!kind) {
      toast.error("Enter a location type.");
      return;
    }

    // Explicit nulls clear the columns — that's what the API's nullable
    // description/parentId handling is for.
    const shared = {
      locationName: name,
      type: kind,
      description: description.trim() || null,
      parentId: parent === NO_PARENT ? null : parent,
    };
    // campaignId is create-only; a location never changes campaigns from here.
    const body: CreateLocationInput | UpdateLocationInput = editing
      ? shared
      : { ...shared, campaignId };

    setSubmitting(true);
    try {
      const res = await fetch(
        editing
          ? `/api/locations/${encodeURIComponent(editing.id)}`
          : "/api/locations",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const failure = await res.json().catch(() => null);
        toast.error(
          failure?.error ??
            (editing
              ? "Could not update location"
              : "Could not create location"),
        );
        return;
      }
      toast.success(editing ? "Location updated" : "Location created");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        {editing ? <PencilIcon /> : <PlusIcon />}
        {editing ? "Edit" : "Add location"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit location" : "New location"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Rename it, retype it, or move it somewhere else in the hierarchy."
              : "Locations nest freely — a realm holds regions, a region holds towns, and so on."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field id="location-name" label="Name">
            <Input
              id="location-name"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              autoFocus
            />
          </Field>
          <Field id="location-type" label="Type">
            <Input
              id="location-type"
              list="location-type-suggestions"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="town"
            />
            <datalist id="location-type-suggestions">
              {suggestions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </Field>
          <Field id="location-parent" label="Parent">
            <EnumSelect
              id="location-parent"
              value={parent}
              onValueChange={setParent}
              items={parentItems}
            />
          </Field>
          <Field id="location-description" label="Description (optional)">
            <Textarea
              id="location-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </Field>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
