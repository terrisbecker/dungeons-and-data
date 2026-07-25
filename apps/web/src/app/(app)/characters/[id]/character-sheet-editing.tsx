"use client";

import { useRef, useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Inline-editing primitives for the character sheet. Every one of these drives a
// single server field through useOptimisticField: click the value, it becomes an
// input, Enter or blur saves, Escape reverts.
//
// Enter and Escape both blur rather than committing directly, so `onBlur` stays
// the single commit path — otherwise "commit on Enter" plus the focus loss it
// causes would fire two writes.

// Past this many boxes a tick grid is unreadable (and a lot of tab stops), so
// large pools fall back to a stepper.
const MAX_BOXES = 12;

const idleClass =
  "hover:bg-muted/60 focus-visible:ring-ring/50 -mx-1 rounded px-1 text-left focus-visible:ring-2 focus-visible:outline-none aria-busy:opacity-60";

export function EditableNumber({
  label,
  value,
  onCommit,
  pending,
  min = 0,
  max,
  nullable = false,
  render,
  className,
  inputClassName,
}: {
  label: string;
  value: number | null;
  onCommit: (next: number | null) => void;
  pending?: boolean;
  min?: number;
  max?: number;
  // Allows an empty input to clear the column (the extra speeds, darkvision).
  nullable?: boolean;
  render?: (value: number | null) => React.ReactNode;
  className?: string;
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const reverting = useRef(false);

  function finish() {
    setEditing(false);
    if (reverting.current) {
      reverting.current = false;
      return;
    }

    const raw = text.trim();
    if (raw === "") {
      if (!nullable) {
        toast.error(`${label} is required.`);
        return;
      }
      if (value !== null) {
        onCommit(null);
      }
      return;
    }

    const next = Number(raw);
    if (!Number.isInteger(next)) {
      toast.error(`${label} must be a whole number.`);
      return;
    }
    if (next < min || (max !== undefined && next > max)) {
      toast.error(
        max === undefined
          ? `${label} must be at least ${min}.`
          : `${label} must be between ${min} and ${max}.`,
      );
      return;
    }
    // Skip the round-trip (and the refresh) when nothing actually changed.
    if (next !== value) {
      onCommit(next);
    }
  }

  if (editing) {
    return (
      <Input
        autoFocus
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        aria-label={label}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          } else if (event.key === "Escape") {
            event.preventDefault();
            reverting.current = true;
            event.currentTarget.blur();
          }
        }}
        onBlur={finish}
        className={cn("h-7 w-16 px-1 text-center", inputClassName)}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`Edit ${label}`}
      aria-busy={pending || undefined}
      onClick={() => {
        setText(value === null ? "" : String(value));
        setEditing(true);
      }}
      className={cn(idleClass, "tabular-nums", className)}
    >
      {render ? render(value) : (value ?? "—")}
    </button>
  );
}

export function EditableText({
  label,
  value,
  onCommit,
  pending,
  multiline = false,
  placeholder,
  className,
}: {
  label: string;
  value: string | null;
  onCommit: (next: string | null) => void;
  pending?: boolean;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const reverting = useRef(false);

  function finish() {
    setEditing(false);
    if (reverting.current) {
      reverting.current = false;
      return;
    }
    // An emptied box clears the column rather than storing "".
    const next = text.trim() === "" ? null : text;
    if (next !== value) {
      onCommit(next);
    }
  }

  if (editing) {
    const shared = {
      autoFocus: true,
      "aria-label": label,
      value: text,
      placeholder,
      onBlur: finish,
    };
    return multiline ? (
      <Textarea
        {...shared}
        rows={3}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          // Enter inserts a newline here; Cmd/Ctrl+Enter is the commit chord.
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            event.currentTarget.blur();
          } else if (event.key === "Escape") {
            event.preventDefault();
            reverting.current = true;
            event.currentTarget.blur();
          }
        }}
        className={className}
      />
    ) : (
      <Input
        {...shared}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          } else if (event.key === "Escape") {
            event.preventDefault();
            reverting.current = true;
            event.currentTarget.blur();
          }
        }}
        className={cn("h-7", className)}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`Edit ${label}`}
      aria-busy={pending || undefined}
      onClick={() => {
        setText(value ?? "");
        setEditing(true);
      }}
      className={cn(idleClass, "block w-full", className)}
    >
      {value ? (
        <span className="whitespace-pre-wrap">{value}</span>
      ) : (
        <span className="text-muted-foreground italic">Add {label}…</span>
      )}
    </button>
  );
}

export function EditableToggle({
  label,
  value,
  onCommit,
  pending,
}: {
  label: string;
  value: boolean;
  onCommit: (next: boolean) => void;
  pending?: boolean;
}) {
  return (
    // Never disabled while pending — that would steal focus mid-toggle; the
    // hook already coalesces rapid flips.
    <label className="flex items-center gap-2 text-sm" aria-busy={pending}>
      <input
        type="checkbox"
        className="accent-primary size-4"
        checked={value}
        onChange={(event) => onCommit(event.target.checked)}
      />
      {label}
    </label>
  );
}

// A row of clickable boxes for a counter that runs 0…count.
//
// Clicking box i sets the counter to i when the box is already filled (unfill it
// and everything after) or i + 1 when it is not (fill through it). So the first
// empty box is exactly +1, the last filled box exactly -1, and jumping to box 5
// spends four in a single request. The value can only ever land in 0…count, so
// the counter clamps for free.
export function TickBoxes({
  count,
  filled,
  onSet,
  groupLabel,
  boxLabel,
  pending,
  fillClass = "bg-primary border-primary",
}: {
  count: number;
  filled: number;
  onSet: (next: number) => void;
  groupLabel: string;
  boxLabel: (index: number) => string;
  pending?: boolean;
  fillClass?: string;
}) {
  return (
    <div
      role="group"
      aria-label={groupLabel}
      aria-busy={pending || undefined}
      className="flex flex-wrap items-center gap-1 aria-busy:opacity-60"
    >
      {Array.from({ length: count }, (_, index) => {
        const isFilled = index < filled;
        return (
          <button
            key={index}
            type="button"
            aria-pressed={isFilled}
            aria-label={boxLabel(index)}
            onClick={() => onSet(isFilled ? index : index + 1)}
            className={cn(
              "hover:border-ring focus-visible:ring-ring/50 size-5 rounded-[4px] border transition-colors focus-visible:ring-2 focus-visible:outline-none",
              isFilled ? fillClass : "bg-transparent",
            )}
          />
        );
      })}
    </div>
  );
}

// Stepper fallback for pools too large to render as boxes (20 ki points), with
// the number itself editable for an exact set.
export function Stepper({
  label,
  value,
  count,
  onSet,
  pending,
  decrementLabel,
  incrementLabel,
}: {
  label: string;
  value: number;
  count: number;
  onSet: (next: number) => void;
  pending?: boolean;
  decrementLabel: string;
  incrementLabel: string;
}) {
  return (
    <div
      className="flex items-center gap-1 aria-busy:opacity-60"
      aria-busy={pending || undefined}
    >
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={decrementLabel}
        disabled={value <= 0}
        onClick={() => onSet(value - 1)}
      >
        <MinusIcon />
      </Button>
      <span className="text-sm tabular-nums">
        <EditableNumber
          label={label}
          value={value}
          onCommit={(next) => next !== null && onSet(next)}
          min={0}
          max={count}
          inputClassName="w-14"
        />
        <span className="text-muted-foreground">/{count}</span>
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={incrementLabel}
        disabled={value >= count}
        onClick={() => onSet(value + 1)}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}

// Boxes when the pool is small enough to read at a glance, a stepper when it
// isn't. Both drive the same 0…count counter.
export function CounterControl({
  count,
  filled,
  onSet,
  groupLabel,
  boxLabel,
  stepperLabel,
  decrementLabel,
  incrementLabel,
  pending,
  fillClass,
}: {
  count: number;
  filled: number;
  onSet: (next: number) => void;
  groupLabel: string;
  boxLabel: (index: number) => string;
  stepperLabel: string;
  decrementLabel: string;
  incrementLabel: string;
  pending?: boolean;
  fillClass?: string;
}) {
  if (count === 0) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  if (count > MAX_BOXES) {
    return (
      <Stepper
        label={stepperLabel}
        value={filled}
        count={count}
        onSet={onSet}
        pending={pending}
        decrementLabel={decrementLabel}
        incrementLabel={incrementLabel}
      />
    );
  }
  return (
    <TickBoxes
      count={count}
      filled={filled}
      onSet={onSet}
      groupLabel={groupLabel}
      boxLabel={boxLabel}
      pending={pending}
      fillClass={fillClass}
    />
  );
}
