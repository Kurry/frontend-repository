import { describe, expect, it } from "vitest";
import {
  compileModules,
  createContractRuntime,
  InMemoryWebMcpHost,
} from "../../src/index.js";
import { mountVueWebMcp, notifyVueNavigation } from "../../src/adapters/vue.js";

describe("vue lifecycle adapter", () => {
  it("registers tools for component scope and disposes cleanly", async () => {
    const host = new InMemoryWebMcpHost();
    const runtime = createContractRuntime({ host });
    const tools = compileModules(
      ["entity-collection-v1"],
      {
        entity: "item",
        entity_operations: ["select"],
      },
      {
        "entity-collection-v1": {
          select: ({ id }) => ({ public_ids: [id] }),
        },
      },
    );

    const unmount = mountVueWebMcp({
      runtime,
      scopeId: "vue-view",
      tools,
    });

    expect(host.listNames()).toContain("entity.select");
    const ack = (await runtime.invoke("entity.select", { id: "1" })) as {
      ok: boolean;
    };
    expect(ack.ok).toBe(true);

    unmount();
    expect(host.listNames()).toEqual([]);
    expect(notifyVueNavigation(runtime)).toBe(1);
  });
});
