import { describe, expect, it } from "vitest";
import { InputValidationError } from "../../src/index.js";
import { createFixtureRuntime } from "../helpers/fixture.js";

describe("form-workflow-v1", () => {
  it("validates/submits declared fields and advances steps", async () => {
    const steps: string[] = [];
    const { runtime } = createFixtureRuntime(
      ["form-workflow-v1"],
      {
        form_fields: ["email", "name"],
        form_operations: ["validate", "submit", "advance", "cancel"],
        workflow_steps: ["account", "confirm"],
      },
      {
        "form-workflow-v1": {
          validate: () => ({ status: "validated" }),
          submit: ({ fields }) => ({
            public_ids: [fields?.email ?? ""],
            status: "submitted",
          }),
          advance: ({ step }) => {
            if (step) steps.push(step);
            return { status: "advanced" };
          },
          cancel: () => ({ status: "cancelled" }),
        },
      },
    );

    await runtime.invoke("form.validate", {
      fields: { email: "a@b.co", name: "Ada" },
    });
    const submitted = (await runtime.invoke("form.submit", {
      fields: { email: "a@b.co", name: "Ada" },
    })) as { ok: boolean; public_ids?: string[] };
    expect(submitted.ok).toBe(true);
    expect(submitted.public_ids).toEqual(["a@b.co"]);

    await runtime.invoke("form.advance", { step: "confirm" });
    expect(steps).toEqual(["confirm"]);

    await expect(
      runtime.invoke("form.advance", { step: "hidden" }),
    ).rejects.toBeInstanceOf(InputValidationError);

    await runtime.invoke("form.cancel", {});
  });
});
