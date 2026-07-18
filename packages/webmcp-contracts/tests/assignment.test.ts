import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CONTRACT_VERSION,
  MODULE_IDS,
  validateAssignmentEntry,
  validateAssignmentMap,
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

  it("loads the seeded 23-task assignment map", () => {
    const path = join(root, "schemas/webmcp-assignment-map.json");
    const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
    const entries = validateAssignmentMap(raw);
    expect(entries).toHaveLength(23);
    expect(new Set(entries.map((e) => e.task)).size).toBe(23);
    for (const e of entries) {
      expect(e.modules.length).toBeGreaterThanOrEqual(1);
      expect(e.modules.length).toBeLessThanOrEqual(4);
    }
  });
});
