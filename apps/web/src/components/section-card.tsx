"use client";

import { useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

// Layout primitives for the add/remove sections on the character sheet and the
// creature stat block: a card whose header toggles an inline form (no modal),
// with per-row remove buttons underneath.

export function SectionCard({
  title,
  description,
  addLabel,
  formTitle,
  onOpenChange,
  open,
  form,
  actions,
  children,
}: {
  title: string;
  description?: string;
  addLabel: string;
  formTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: React.ReactNode;
  // Extra header buttons beside Add — the rest buttons on Spell Slots and
  // Resources.
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {actions}
            <Button
              size="sm"
              variant="outline"
              aria-expanded={open}
              onClick={() => onOpenChange(!open)}
            >
              {open ? <XIcon /> : <PlusIcon />}
              {open ? "Close" : addLabel}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {open && (
          <div className="bg-muted/30 flex flex-col gap-3 rounded-lg border p-4">
            <p className="text-sm font-medium">{formTitle}</p>
            {form}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

// `confirm`, when given, gates the removal behind a small dialog naming the
// specific row (e.g. "Remove Longsword from inventory?") instead of firing
// immediately — matches the confirm step every other destructive action in
// the app already has (creature delete, location delete, catalog delete).
export function RemoveButton({
  onRemove,
  confirm,
}: {
  onRemove: () => void | Promise<void>;
  confirm?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function run() {
    setBusy(true);
    await onRemove();
    setBusy(false);
    setOpen(false);
  }

  if (!confirm) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Remove"
        disabled={busy}
        onClick={run}
      >
        <XIcon />
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="Remove" />}
      >
        <XIcon />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{confirm}</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button onClick={run} disabled={busy}>
            {busy ? "Removing…" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-muted-foreground text-sm">{text}</p>;
}

// Click-to-open detail for a catalog-backed row. Only the label is the trigger,
// so the row's Remove button doesn't end up nested inside a button. Wider than
// the primitive's default because item and spell descriptions are long.
export function RowDetail({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="hover:bg-muted/60 focus-visible:ring-ring/50 -mx-1 rounded px-1 text-left focus-visible:ring-2 focus-visible:outline-none"
          />
        }
      >
        {label}
      </PopoverTrigger>
      <PopoverContent className="max-h-[65vh] w-96 overflow-y-auto">
        {children}
      </PopoverContent>
    </Popover>
  );
}

// Shared empty/loading hint shown inside a picker form while its catalog loads.
export function CatalogHint({
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

// The labels default to the add case; an edit form passes "Save"/"Saving…".
export function FormButtons({
  submitting,
  onCancel,
  submitLabel = "Add",
  pendingLabel = "Adding…",
}: {
  submitting: boolean;
  onCancel: () => void;
  submitLabel?: string;
  pendingLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={submitting}>
        {submitting ? pendingLabel : submitLabel}
      </Button>
    </div>
  );
}
