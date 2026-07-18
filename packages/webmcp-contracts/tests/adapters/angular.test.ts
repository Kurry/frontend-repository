import { describe, expect, it } from "vitest";
import {
  compileModules,
  createContractRuntime,
  InMemoryWebMcpHost,
} from "../../src/index.js";
import {
  mountAngularWebMcp,
  notifyAngularNavigation,
  type AngularDestroyRefLike,
} from "../../src/adapters/angular.js";

describe("angular lifecycle adapter", () => {
  it("ties disposal to DestroyRef.onDestroy", async () => {
    const host = new InMemoryWebMcpHost();
    const runtime = createContractRuntime({ host });
    const tools = compileModules(
      ["form-workflow-v1"],
      {
        form_fields: ["email"],
        form_operations: ["submit"],
      },
      {
        "form-workflow-v1": {
          submit: () => ({ status: "submitted" }),
        },
      },
    );

    let onDestroyCb: (() => void) | undefined;
    const destroyRef: AngularDestroyRefLike = {
      onDestroy: (cb) => {
        onDestroyCb = cb;
      },
    };

    mountAngularWebMcp({
      runtime,
      scopeId: "ng-form",
      tools,
      destroyRef,
      bumpEpochOnMount: true,
    });

    expect(runtime.navigationEpoch).toBe(1);
    expect(runtime.listTools()).toContain("form.submit");
    await runtime.invoke("form.submit", { fields: { email: "a@b.co" } });

    onDestroyCb?.();
    expect(runtime.listTools()).toEqual([]);
    expect(notifyAngularNavigation(runtime)).toBe(2);
  });
});
