import { describe, expect, it } from "vitest";
import { InputValidationError } from "../../src/index.js";
import { createFixtureRuntime } from "../helpers/fixture.js";

describe("entity-collection-v1", () => {
  it("compiles only permitted ops and requires delete confirm", async () => {
    const deleted: string[] = [];
    const { runtime, tools } = createFixtureRuntime(
      ["entity-collection-v1"],
      {
        entity: "user",
        entity_operations: ["create", "delete", "quantity"],
        entity_fields: ["name", "role"],
        value_bounds: { quantity: { min: 0, max: 5 } },
      },
      {
        "entity-collection-v1": {
          create: ({ fields }) => ({
            public_ids: [fields?.name ?? "new"],
            status: "created",
          }),
          delete: ({ id }) => {
            deleted.push(id);
            return { status: "deleted" };
          },
          quantity: ({ id, quantity }) => ({
            public_ids: [id],
            message: String(quantity),
          }),
        },
      },
    );

    expect(tools.map((t) => t.name).sort()).toEqual([
      "entity.create",
      "entity.delete",
      "entity.quantity",
    ]);

    const created = (await runtime.invoke("entity.create", {
      fields: { name: "Ada", role: "admin" },
    })) as { ok: boolean };
    expect(created.ok).toBe(true);

    await expect(
      runtime.invoke("entity.delete", { id: "u1", confirm: false }),
    ).rejects.toBeInstanceOf(InputValidationError);

    await runtime.invoke("entity.delete", { id: "u1", confirm: true });
    expect(deleted).toEqual(["u1"]);

    await expect(
      runtime.invoke("entity.quantity", { id: "u1", quantity: 99 }),
    ).rejects.toBeInstanceOf(InputValidationError);

    // Forbidden generic patch / selector keys
    await expect(
      runtime.invoke("entity.create", {
        fields: { name: "x" },
        patch: { anything: true },
      }),
    ).rejects.toBeInstanceOf(InputValidationError);
  });

  it("rejects unknown entity fields", async () => {
    const { runtime } = createFixtureRuntime(
      ["entity-collection-v1"],
      {
        entity: "item",
        entity_operations: ["update"],
        entity_fields: ["title"],
      },
      {
        "entity-collection-v1": {
          update: () => ({ status: "updated" }),
        },
      },
    );
    await expect(
      runtime.invoke("entity.update", {
        id: "1",
        fields: { secret: "nope" },
      }),
    ).rejects.toBeInstanceOf(InputValidationError);
  });
});
