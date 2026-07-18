import { describe, expect, it } from "vitest";
import { InputValidationError } from "../../src/index.js";
import { createFixtureRuntime } from "../helpers/fixture.js";

describe("structured-editor-v1", () => {
  it("permits declared editor ops and rejects unknown properties", async () => {
    const props: Array<{ property: string; value: string }> = [];
    const { runtime } = createFixtureRuntime(
      ["structured-editor-v1"],
      {
        editor_object_types: ["layer", "text"],
        editor_properties: ["fill", "label"],
        editor_modes: ["design", "preview"],
        editor_operations: [
          "add",
          "update_property",
          "switch_mode",
          "preview",
          "set_content",
        ],
        value_bounds: { content: { maxLength: 10 } },
      },
      {
        "structured-editor-v1": {
          add: ({ type }) => ({ public_ids: [type] }),
          update_property: (input) => {
            props.push({ property: input.property, value: input.value });
            return { status: "property_updated" };
          },
          switch_mode: ({ mode }) => ({ public_ids: [mode] }),
          preview: () => ({ status: "previewed" }),
          set_content: () => ({ status: "content_set" }),
        },
      },
    );

    await runtime.invoke("editor.add", { type: "layer" });
    await runtime.invoke("editor.update_property", {
      id: "l1",
      property: "fill",
      value: "#fff",
    });
    expect(props).toEqual([{ property: "fill", value: "#fff" }]);

    await expect(
      runtime.invoke("editor.update_property", {
        id: "l1",
        property: "xpath",
        value: "//div",
      }),
    ).rejects.toBeInstanceOf(InputValidationError);

    await expect(
      runtime.invoke("editor.set_content", {
        id: "t1",
        content: "this is too long",
      }),
    ).rejects.toBeInstanceOf(InputValidationError);

    await runtime.invoke("editor.switch_mode", { mode: "preview" });
    await runtime.invoke("editor.preview", {});
  });
});
