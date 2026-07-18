import { describe, expect, it } from "vitest";
import { InputValidationError } from "../../src/index.js";
import { createFixtureRuntime } from "../helpers/fixture.js";

describe("artifact-transfer-v1", () => {
  it("permits declared transfer modes and rejects file payload keys", async () => {
    const modes: string[] = [];
    const { runtime } = createFixtureRuntime(
      ["artifact-transfer-v1"],
      {
        artifact_operations: ["import", "export", "copy", "convert"],
        import_modes: ["palette", "json"],
        export_formats: ["css", "json"],
        conversion_modes: ["hex-to-rgb"],
      },
      {
        "artifact-transfer-v1": {
          import: ({ mode }) => {
            modes.push(mode);
            return { status: "import_started" };
          },
          export: ({ format }) => ({ public_ids: [format] }),
          copy: () => ({ status: "copy_triggered" }),
          convert: ({ mode }) => ({ public_ids: [mode] }),
        },
      },
    );

    await runtime.invoke("artifact.import", { mode: "palette" });
    expect(modes).toEqual(["palette"]);

    const exported = (await runtime.invoke("artifact.export", {
      format: "css",
    })) as { ok: boolean; public_ids?: string[] };
    expect(exported.public_ids).toEqual(["css"]);

    await runtime.invoke("artifact.copy", {});
    await runtime.invoke("artifact.convert", { mode: "hex-to-rgb" });

    await expect(
      runtime.invoke("artifact.import", {
        mode: "palette",
        base64: "aaaa",
      }),
    ).rejects.toBeInstanceOf(InputValidationError);

    await expect(
      runtime.invoke("artifact.export", { format: "exe" }),
    ).rejects.toBeInstanceOf(InputValidationError);
  });
});
