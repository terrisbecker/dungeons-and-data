"use client";

import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

// Shared filter/search building blocks for the four catalog managers
// (items/spells/feats/features). Filtering happens client-side over the
// already-fetched rows, so these are pure UI + predicate helpers.

// Sentinel for "no filter applied" in an EnumSelect. Real enum values are
// always uppercase but never literally "ALL", so this is collision-safe.
export const ALL_FILTER = "ALL";

export function withAll(
  items: Record<string, string>,
  allLabel = "All",
): Record<string, string> {
  return { [ALL_FILTER]: allLabel, ...items };
}

export function boolFilterItems(
  yesLabel: string,
  noLabel: string,
): Record<string, string> {
  return { [ALL_FILTER]: "All", TRUE: yesLabel, FALSE: noLabel };
}

export function matchesName(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return name.toLowerCase().includes(q);
}

export function CatalogSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-48 flex-1">
      <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-end gap-3">{children}</div>;
}
