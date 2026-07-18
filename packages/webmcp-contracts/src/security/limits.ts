import { FORBIDDEN_OUTPUT_PATTERNS, OUTPUT_LIMITS } from "../constants.js";
import { InputValidationError } from "../errors.js";
import type { Acknowledgement } from "../types.js";

function truncateString(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}

function containsForbidden(text: string): boolean {
  return FORBIDDEN_OUTPUT_PATTERNS.some((re) => re.test(text));
}

function boundValue(value: unknown, depth: number): unknown {
  if (depth > OUTPUT_LIMITS.maxDepth) return "[truncated-depth]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    const clipped = truncateString(value, OUTPUT_LIMITS.maxStringLength);
    if (containsForbidden(clipped)) return "[redacted]";
    return clipped;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value
      .slice(0, OUTPUT_LIMITS.maxArrayLength)
      .map((item) => boundValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(
      0,
      OUTPUT_LIMITS.maxObjectKeys,
    );
    const out: Record<string, unknown> = {};
    for (const [key, nested] of entries) {
      if (containsForbidden(key)) continue;
      out[key] = boundValue(nested, depth + 1);
    }
    return out;
  }
  return String(value);
}

export function boundAcknowledgement(
  ack: Acknowledgement,
): Acknowledgement {
  const publicIds = (ack.public_ids ?? [])
    .slice(0, OUTPUT_LIMITS.maxArrayLength)
    .map((id) => truncateString(String(id), OUTPUT_LIMITS.maxStringLength))
    .filter((id) => !containsForbidden(id));

  const message =
    ack.message === undefined
      ? undefined
      : truncateString(String(ack.message), OUTPUT_LIMITS.maxStringLength);

  const bounded: Acknowledgement = {
    ok: Boolean(ack.ok),
    status: truncateString(String(ack.status || "ack"), 64),
    navigation_epoch: Number(ack.navigation_epoch) || 0,
  };
  if (publicIds.length > 0) bounded.public_ids = publicIds;
  if (message !== undefined && !containsForbidden(message)) {
    bounded.message = message;
  }

  const serialized = JSON.stringify(bounded);
  if (serialized.length > OUTPUT_LIMITS.maxTotalChars) {
    return {
      ok: bounded.ok,
      status: "truncated",
      navigation_epoch: bounded.navigation_epoch,
    };
  }
  return bounded;
}

export function assertNoForbiddenInputKeys(
  input: Record<string, unknown>,
  forbidden: readonly string[],
): void {
  const stack: unknown[] = [input];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }
    for (const [key, value] of Object.entries(current as Record<string, unknown>)) {
      if (forbidden.includes(key)) {
        throw new InputValidationError(`Forbidden input key: ${key}`);
      }
      if (value && typeof value === "object") stack.push(value);
    }
  }
}

export function assertEnum(
  value: unknown,
  allowed: readonly string[],
  field: string,
): string {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new InputValidationError(
      `Invalid ${field}: expected one of ${allowed.join(", ")}`,
    );
  }
  return value;
}

export function assertBoundedString(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new InputValidationError(`${field} must be a non-empty string`);
  }
  if (value.length > maxLength) {
    throw new InputValidationError(
      `${field} exceeds maxLength ${maxLength}`,
    );
  }
  return value;
}

export function assertBoundedNumber(
  value: unknown,
  field: string,
  min?: number,
  max?: number,
): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new InputValidationError(`${field} must be a number`);
  }
  if (min !== undefined && value < min) {
    throw new InputValidationError(`${field} below minimum ${min}`);
  }
  if (max !== undefined && value > max) {
    throw new InputValidationError(`${field} above maximum ${max}`);
  }
  return value;
}

/** Test helper / diagnostics — not for product use. */
export function debugBoundValue(value: unknown): unknown {
  return boundValue(value, 0);
}
