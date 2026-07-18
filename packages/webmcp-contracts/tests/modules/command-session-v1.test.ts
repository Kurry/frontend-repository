import { describe, expect, it } from "vitest";
import { InputValidationError } from "../../src/index.js";
import { createFixtureRuntime } from "../helpers/fixture.js";

describe("command-session-v1", () => {
  it("invokes session controls without proving playback success", async () => {
    const ops: string[] = [];
    const { runtime } = createFixtureRuntime(
      ["command-session-v1"],
      {
        session_operations: ["start", "pause", "stop", "trigger_demo"],
        demos: ["intro", "loop"],
      },
      {
        "command-session-v1": {
          start: () => {
            ops.push("start");
            return { status: "start_requested" };
          },
          pause: () => {
            ops.push("pause");
            return { status: "pause_requested" };
          },
          stop: () => {
            ops.push("stop");
            return { status: "stop_requested" };
          },
          trigger_demo: ({ demo }) => {
            ops.push(demo);
            return { status: "demo_triggered", public_ids: [demo] };
          },
        },
      },
    );

    const start = (await runtime.invoke("session.start", {})) as {
      ok: boolean;
      status: string;
    };
    expect(start.ok).toBe(true);
    expect(start.status).toBe("start_requested");

    await runtime.invoke("session.pause", {});
    await runtime.invoke("session.trigger_demo", { demo: "intro" });
    expect(ops).toEqual(["start", "pause", "intro"]);

    await expect(
      runtime.invoke("session.trigger_demo", { demo: "cheat" }),
    ).rejects.toBeInstanceOf(InputValidationError);

    // resume not permitted
    expect(runtime.listTools()).not.toContain("session.resume");
  });
});
