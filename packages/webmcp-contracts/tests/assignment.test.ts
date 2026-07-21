import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CONTRACT_VERSION,
  MODULE_IDS,
  validateAssignmentEntry,
  BindingValidationError,
} from "../src/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("assignment map", () => {
  it("validates entry shape and module bindings", () => {
    const entry = validateAssignmentEntry({
      task: "frontend-daisyui",
      modules: ["browse-query-v1", "entity-collection-v1"],
      bindings: {
        destinations: ["dashboard", "users"],
        entity: "user",
        entity_operations: ["create", "update", "delete"],
        entity_fields: ["name", "role"],
      },
      mechanics_exclusions: [],
    });
    expect(entry.task).toBe("frontend-daisyui");
    expect(CONTRACT_VERSION).toBe("zto-webmcp-v1");
    expect(MODULE_IDS).toHaveLength(6);
  });

  it("rejects a seventh / unknown module", () => {
    expect(() =>
      validateAssignmentEntry({
        task: "frontend-x",
        modules: ["browse-query-v1", "custom-module-v1"],
        bindings: { destinations: ["a"] },
        mechanics_exclusions: [],
      }),
    ).toThrow(BindingValidationError);
  });

  it("loads the canonical 103-task assignment inventory", () => {
    const path = join(
      root,
      "packages/corpuscheck/src/corpuscheck/schemas/webmcp-assignments.json",
    );
    const raw = JSON.parse(readFileSync(path, "utf8")) as {
      contract_version?: unknown;
      module_catalog?: unknown;
      assignments?: unknown;
    };
    expect(raw.contract_version).toBe(CONTRACT_VERSION);
    expect(Array.isArray(raw.module_catalog)).toBe(true);
    expect([...(raw.module_catalog as string[])].sort()).toEqual(
      [...MODULE_IDS].sort(),
    );
    expect(Array.isArray(raw.assignments)).toBe(true);

    const entries = raw.assignments as Array<{
      task: string;
      modules: string[];
    }>;
    expect(entries).toHaveLength(103);
    expect(new Set(entries.map((e) => e.task)).size).toBe(103);
    for (const e of entries) {
      expect(e.task).toMatch(/^frontend-[a-z0-9-]+$/);
      expect(e.modules.length).toBeGreaterThanOrEqual(1);
      expect(e.modules.length).toBeLessThanOrEqual(4);
      expect(new Set(e.modules).size).toBe(e.modules.length);
      for (const module of e.modules) expect(MODULE_IDS).toContain(module);
    }
  });
});
