import { BindingValidationError } from "../errors.js";

export function asObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new BindingValidationError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function optionalStringList(
  value: unknown,
  field: string,
): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string" || !v)) {
    throw new BindingValidationError(`${field} must be a string array`);
  }
  return value as string[];
}

export function requireStringList(
  value: unknown,
  field: string,
  minItems = 1,
): string[] {
  const list = optionalStringList(value, field);
  if (!list || list.length < minItems) {
    throw new BindingValidationError(
      `${field} must contain at least ${minItems} string(s)`,
    );
  }
  return list;
}

export function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length === 0) {
    throw new BindingValidationError(`${field} must be a non-empty string`);
  }
  return value;
}

export function requireEnumSubset(
  value: unknown,
  field: string,
  allowed: readonly string[],
  minItems = 1,
): string[] {
  const list = requireStringList(value, field, minItems);
  for (const item of list) {
    if (!allowed.includes(item)) {
      throw new BindingValidationError(
        `${field} contains unknown value "${item}"`,
      );
    }
  }
  return list;
}

export function rejectUnknownKeys(
  obj: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) {
      throw new BindingValidationError(
        `${label} has unknown binding key "${key}"`,
      );
    }
  }
}

export function requireAnyOf(
  obj: Record<string, unknown>,
  groups: readonly (readonly string[])[],
  label: string,
): void {
  const ok = groups.some((group) => group.every((key) => obj[key] !== undefined));
  if (!ok) {
    const desc = groups.map((g) => g.join("+")).join(" | ");
    throw new BindingValidationError(
      `${label} requires one of: ${desc}`,
    );
  }
}
