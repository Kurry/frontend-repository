import { describe, expect, it } from "vitest";
import {
  compileModules,
  createContractRuntime,
  InMemoryWebMcpHost,
} from "../../src/index.js";
import {
  attachAstroRouteLifecycle,
  mountVanillaWebMcp,
  notifyVanillaNavigation,
} from "../../src/adapters/vanilla.js";

class FakeTarget extends EventTarget {}

describe("vanilla/astro lifecycle adapter", () => {
  it("mounts vanilla tools and disposes", async () => {
    const host = new InMemoryWebMcpHost();
    const runtime = createContractRuntime({ host });
    const tools = compileModules(
      ["artifact-transfer-v1"],
      {
        artifact_operations: ["export"],
        export_formats: ["json"],
      },
      {
        "artifact-transfer-v1": {
          export: ({ format }) => ({ public_ids: [format] }),
        },
      },
    );

    const unmount = mountVanillaWebMcp({
      runtime,
      scopeId: "vanilla",
      tools,
    });
    await runtime.invoke("artifact.export", { format: "json" });
    unmount();
    expect(runtime.listTools()).toEqual([]);
  });

  it("remounts across Astro page-load / before-swap", async () => {
    const host = new InMemoryWebMcpHost();
    const runtime = createContractRuntime({ host });
    const target = new FakeTarget();
    const tools = compileModules(
      ["command-session-v1"],
      { session_operations: ["start"] },
      { "command-session-v1": { start: () => ({ status: "start" }) } },
    );

    const detach = attachAstroRouteLifecycle({
      runtime,
      scopeId: "astro-route",
      tools,
      eventTarget: target,
    });

    expect(runtime.listTools()).toContain("session.start");
    const epochAfterFirst = runtime.navigationEpoch;
    expect(epochAfterFirst).toBeGreaterThanOrEqual(1);

    target.dispatchEvent(new Event("astro:before-swap"));
    expect(runtime.listTools()).toEqual([]);

    target.dispatchEvent(new Event("astro:page-load"));
    expect(runtime.listTools()).toContain("session.start");
    expect(runtime.navigationEpoch).toBeGreaterThan(epochAfterFirst);

    detach();
    expect(runtime.listTools()).toEqual([]);
    expect(notifyVanillaNavigation(runtime)).toBeGreaterThan(0);
  });
});
