import { badRequest } from "./http-error.js";

// Small primitive validators used by the service layer. They read a field off a
// raw request body and either return a well-typed value or throw a generic 400.
// These are deliberately not a CRUD factory — just shared field parsing.

export function asRecord(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw badRequest();
  }
  return body as Record<string, unknown>;
}

export function requireString(
  obj: Record<string, unknown>,
  key: string,
): string {
  const value = obj[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw badRequest();
  }
  return value;
}

export function optionalString(
  obj: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = obj[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw badRequest();
  }
  return value;
}

export function requireInt(
  obj: Record<string, unknown>,
  key: string,
  { min, max }: { min?: number; max?: number } = {},
): number {
  const value = obj[key];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw badRequest();
  }
  if (
    (min !== undefined && value < min) ||
    (max !== undefined && value > max)
  ) {
    throw badRequest();
  }
  return value;
}

export function optionalInt(
  obj: Record<string, unknown>,
  key: string,
  bounds: { min?: number; max?: number } = {},
): number | undefined {
  if (obj[key] === undefined || obj[key] === null) {
    return undefined;
  }
  return requireInt(obj, key, bounds);
}

export function optionalFloat(
  obj: Record<string, unknown>,
  key: string,
  { min }: { min?: number } = {},
): number | undefined {
  const value = obj[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw badRequest();
  }
  if (min !== undefined && value < min) {
    throw badRequest();
  }
  return value;
}

export function requireBoolean(
  obj: Record<string, unknown>,
  key: string,
): boolean {
  const value = obj[key];
  if (typeof value !== "boolean") {
    throw badRequest();
  }
  return value;
}

export function optionalBoolean(
  obj: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const value = obj[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "boolean") {
    throw badRequest();
  }
  return value;
}

export function requireEnum<T extends string>(
  obj: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): T {
  const value = obj[key];
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw badRequest();
  }
  return value as T;
}

export function optionalEnum<T extends string>(
  obj: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): T | undefined {
  if (obj[key] === undefined || obj[key] === null) {
    return undefined;
  }
  return requireEnum(obj, key, allowed);
}

export function optionalEnumArray<T extends string>(
  obj: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): T[] | undefined {
  const value = obj[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (
    !Array.isArray(value) ||
    value.some((v) => typeof v !== "string" || !allowed.includes(v as T))
  ) {
    throw badRequest();
  }
  return value as T[];
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Validate a UUID taken from a route param or query string. Guards Postgres
// from receiving malformed uuid text (which would otherwise surface as a 500).
export function requireUuid(value: unknown): string {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw badRequest();
  }
  return value;
}

export function requireUuidField(
  obj: Record<string, unknown>,
  key: string,
): string {
  return requireUuid(obj[key]);
}

export function optionalUuidField(
  obj: Record<string, unknown>,
  key: string,
): string | undefined {
  if (obj[key] === undefined || obj[key] === null) {
    return undefined;
  }
  return requireUuid(obj[key]);
}

export function optionalStringArray(
  obj: Record<string, unknown>,
  key: string,
): string[] | undefined {
  const value = obj[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    throw badRequest();
  }
  return value as string[];
}
