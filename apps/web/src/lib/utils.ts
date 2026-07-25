import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Signed display for a d20 modifier: +3 / -1 / +0. Directive-free so both
// server and client components can use it.
export function formatModifier(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}
