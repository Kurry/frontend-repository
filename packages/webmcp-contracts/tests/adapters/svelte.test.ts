import { describe, expect, it } from "vitest";
import {
  compileModules,
  createContractRuntime,
  InMemoryWebMcpHost,
} from "../../src/index.js";
import {
  mountSvelteWebMcp,
  notifySvelteNavigation,
} from "../../src/adapters/svelte.js";

describe("svelte lifecycle adapter", () => {
  it("registers on mount and cleans up on destroy", async () => {
    const host = new InMemoryWebMcpHost();
    const runtime = createContractRuntime({ host });
    const tools = compileModules(
      ["browse-query-v1"],
      { destinations: ["home"] },
      { "browse-query-v1": { open: () => ({ status: "ok" }) } },
    );

    const destroy = mountSvelteWebMcp({
      runtime,
      scopeId: "svelte-page",
      tools,
      bumpEpochOnMount: true,
    });

    expect(runtime.navigationEpoch).toBe(1);
    expect(runtime.listTools()).toContain("browse.open");
    const ack = (await runtime.invoke("browse.open", {
      destination: "home",
    })) as { ok: boolean };
    expect(ack.ok).toBe(true);

    destroy();
    expect(runtime.listTools()).toEqual([]);
    expect(notifySvelteNavigation(runtime)).toBe(2);
  });
});
