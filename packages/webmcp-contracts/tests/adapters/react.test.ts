import { describe, expect, it } from "vitest";
import {
  compileModules,
  createContractRuntime,
  InMemoryWebMcpHost,
} from "../../src/index.js";
import {
  mountReactWebMcp,
  notifyReactNavigation,
} from "../../src/adapters/react.js";

describe("react lifecycle adapter", () => {
  it("registers a shared contract and cleans up on unmount", async () => {
    const host = new InMemoryWebMcpHost();
    const runtime = createContractRuntime({ host });
    const tools = compileModules(
      ["browse-query-v1", "entity-collection-v1"],
      {
        destinations: ["users"],
        entity: "user",
        entity_operations: ["create"],
        entity_fields: ["name"],
      },
      {
        "browse-query-v1": { open: () => ({ status: "opened" }) },
        "entity-collection-v1": {
          create: ({ fields }) => ({ public_ids: [fields?.name ?? ""] }),
        },
      },
    );

    const unmount = mountReactWebMcp({
      runtime,
      scopeId: "react-admin",
      tools,
    });

    expect(runtime.listTools()).toEqual(
      expect.arrayContaining(["browse.open", "entity.create"]),
    );
    await runtime.invoke("browse.open", { destination: "users" });
    const created = (await runtime.invoke("entity.create", {
      fields: { name: "Ada" },
    })) as { public_ids?: string[] };
    expect(created.public_ids).toEqual(["Ada"]);

    unmount();
    expect(runtime.listTools()).toEqual([]);
    expect(notifyReactNavigation(runtime)).toBe(1);
  });
});
