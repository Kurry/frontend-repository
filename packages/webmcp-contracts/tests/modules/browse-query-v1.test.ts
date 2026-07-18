import { describe, expect, it } from "vitest";
import {
  BindingValidationError,
  EpochMismatchError,
  InputValidationError,
} from "../../src/index.js";
import { createFixtureRuntime } from "../helpers/fixture.js";

describe("browse-query-v1", () => {
  it("permits open/search and rejects undeclared destinations", async () => {
    const opened: string[] = [];
    const { runtime } = createFixtureRuntime(
      ["browse-query-v1"],
      {
        destinations: ["dashboard", "users"],
        filters: ["role"],
        themes: ["light", "dark"],
      },
      {
        "browse-query-v1": {
          open: ({ destination }) => {
            opened.push(destination);
            return { public_ids: [destination], status: "opened" };
          },
          search: ({ query }) => ({ message: query }),
          apply_filter: () => ({ status: "filter_applied" }),
          set_theme: ({ theme }) => ({ public_ids: [theme] }),
        },
      },
    );

    const ack = (await runtime.invoke("browse.open", {
      destination: "users",
    })) as { ok: boolean; public_ids?: string[] };
    expect(ack.ok).toBe(true);
    expect(opened).toEqual(["users"]);
    expect(ack.public_ids).toEqual(["users"]);

    await expect(
      runtime.invoke("browse.open", { destination: "secret" }),
    ).rejects.toBeInstanceOf(InputValidationError);

    const search = (await runtime.invoke("browse.search", {
      query: "alice",
    })) as { ok: boolean };
    expect(search.ok).toBe(true);

    await runtime.invoke("browse.apply_filter", { filter: "role", value: "admin" });
    await runtime.invoke("browse.set_theme", { theme: "dark" });
  });

  it("requires destinations and validates registration cleanup", async () => {
    expect(() =>
      createFixtureRuntime(["browse-query-v1"], { filters: ["role"] }),
    ).toThrow(BindingValidationError);

    const { runtime, disposable } = createFixtureRuntime(
      ["browse-query-v1"],
      { destinations: ["home"] },
      { "browse-query-v1": { open: () => ({ status: "ok" }) } },
    );
    expect(runtime.listTools()).toContain("browse.open");
    disposable.dispose();
    expect(runtime.listTools()).toEqual([]);
  });

  it("invalidates invokes when navigation epoch mismatches", async () => {
    const { runtime } = createFixtureRuntime(
      ["browse-query-v1"],
      { destinations: ["home"] },
      { "browse-query-v1": { open: () => ({ status: "ok" }) } },
    );
    expect(runtime.navigationEpoch).toBe(0);
    runtime.bumpNavigationEpoch();
    await expect(
      runtime.invoke("browse.open", { destination: "home" }, 0),
    ).rejects.toBeInstanceOf(EpochMismatchError);
  });

  it("bounds untrusted acknowledgement output", async () => {
    const { runtime } = createFixtureRuntime(
      ["browse-query-v1"],
      { destinations: ["home"] },
      {
        "browse-query-v1": {
          open: () => ({
            message: "x".repeat(500),
            public_ids: ["ok", "this has a rubric criterion"],
          }),
        },
      },
    );
    const ack = (await runtime.invoke("browse.open", {
      destination: "home",
    })) as { message?: string; public_ids?: string[] };
    expect(ack.message!.length).toBeLessThanOrEqual(200);
    expect(ack.public_ids).toEqual(["ok"]);
  });
});
