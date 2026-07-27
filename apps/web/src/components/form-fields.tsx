"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Shared form primitives used by the character wizard, the sheet's inline
// add/remove sections, and the catalog managers. Kept here so the three
// form-heavy areas stay consistent (and DRY).

export function Field({
  id,
  label,
  children,
}: {
  id?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

// A plain labelled checkbox for the in-card add forms (equipped/attuned and
// friends). The inline *editors* live in editable-fields.tsx — this one is
// uncontrolled-by-the-server form state, not a committed field.
export function Checkbox({
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

// A <Select> driven by a plain `{ value: label }` map. The base-ui Select
// callback is `(value: string | null) => void`; we narrow it to string here so
// callers get a simple `(value: string) => void`.
export function EnumSelect({
  id,
  value,
  onValueChange,
  items,
  placeholder,
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  items: Record<string, string>;
  placeholder?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as string)}
      items={items}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(items).map(([val, label]) => (
          <SelectItem key={val} value={val}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
