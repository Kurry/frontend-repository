import { z } from "zod";
import { dimensions } from "./seed";

export const classifications = ["agent-bug", "rubric-bug", "scorer-error"];

export const adjudicationSchema = z.object({
  criterionId: z.string().trim().min(1, "criterionId is required"),
  classification: z.enum(classifications, {
    error: "classification must be agent-bug, rubric-bug, or scorer-error",
  }),
  rationale: z
    .string()
    .trim()
    .min(20, "rationale must be at least 20 characters")
    .max(2000, "rationale must be at most 2000 characters"),
  reviewedAt: z.iso.datetime({
    message: "reviewedAt must be an ISO-8601 timestamp",
  }),
  evidenceStepIds: z
    .array(
      z
        .number()
        .int()
        .nonnegative("evidenceStepIds entries must be non-negative integers"),
    )
    .min(1, "evidenceStepIds must contain at least one step")
    .optional(),
});

export const adjudicationFormSchema = adjudicationSchema
  .omit({ reviewedAt: true, evidenceStepIds: true })
  .extend({
    evidenceStepIds: z
      .array(
        z
          .number()
          .int()
          .nonnegative("evidenceStepIds entries must be non-negative integers"),
      )
      .optional(),
  });

export const bulkSchema = z.object({
  classification: z.enum(classifications, {
    error: "classification must be selected",
  }),
  rationale: z
    .string()
    .trim()
    .min(20, "rationale must be at least 20 characters")
    .max(2000, "rationale must be at most 2000 characters"),
});

export const importDraftSchema = z.object({
  json: z.string().trim().min(1, "Review Package JSON is required"),
});

export const reviewPackageBaseSchema = z.object({
  schemaVersion: z.literal("review-package/v1", {
    error: "schemaVersion must equal review-package/v1",
  }),
  exportedAt: z.iso.datetime({
    message: "exportedAt must be an ISO-8601 timestamp",
  }),
  taskId: z.string().min(1, "taskId is required"),
  trialId: z.string().min(1, "trialId is required"),
  model: z.string().min(1, "model is required"),
  activeLabel: z.string().min(1, "activeLabel is required"),
  comparedLabels: z
    .array(z.string().min(1))
    .length(2, "comparedLabels must contain exactly two labels")
    .refine(([a, b]) => a !== b, "comparedLabels must be distinct"),
  dimensionRollup: z.record(z.string(), z.number()),
  adjudications: z.array(adjudicationSchema),
  summaryCounts: z.object({
    "agent-bug": z.number().int().nonnegative(),
    "rubric-bug": z.number().int().nonnegative(),
    "scorer-error": z.number().int().nonnegative(),
  }),
  flipCriterionIds: z.array(z.string()),
});

export function validateReviewPackage(input, task, trial) {
  const parsed = reviewPackageBaseSchema.safeParse(input);
  if (!parsed.success) return parsed;
  const data = parsed.data;
  const issues = [];
  const add = (path, message) =>
    issues.push({ code: "custom", path: [path], message });
  if (data.taskId !== task.id) add("taskId", "taskId must match the open task");
  if (data.trialId !== trial.id)
    add("trialId", "trialId must match the open trial");
  if (data.model !== trial.model)
    add("model", "model must match the open trial");
  if (!trial.labelNames.includes(data.activeLabel))
    add("activeLabel", "activeLabel must name a label in this trial");
  if (data.comparedLabels.some((label) => !trial.labelNames.includes(label)))
    add("comparedLabels", "comparedLabels must name labels in this trial");
  const expectedKeys = dimensions.map((d) => d.id).sort();
  const actualKeys = Object.keys(data.dimensionRollup).sort();
  if (JSON.stringify(expectedKeys) !== JSON.stringify(actualKeys))
    add(
      "dimensionRollup",
      `dimensionRollup keys must be ${expectedKeys.join(", ")}`,
    );
  if (
    trial.results[data.activeLabel] &&
    dimensions.some(
      (dimension) =>
        data.dimensionRollup[dimension.id] !==
        trial.results[data.activeLabel].scores[dimension.id],
    )
  )
    add(
      "dimensionRollup",
      "dimensionRollup values must match the activeLabel scores",
    );
  const criterionIds = new Set(trial.criteria.map((c) => c.id));
  data.adjudications.forEach((record, i) => {
    if (!criterionIds.has(record.criterionId))
      issues.push({
        code: "custom",
        path: ["adjudications", i, "criterionId"],
        message: "criterionId must exist in this trial",
      });
    const maxIndex =
      Math.max(trial.agentSteps.length, trial.scorerSteps.length) - 1;
    if (record.evidenceStepIds?.some((id) => id > maxIndex))
      issues.push({
        code: "custom",
        path: ["adjudications", i, "evidenceStepIds"],
        message: "evidenceStepIds entry does not exist in this trial",
      });
  });
  const counts = { "agent-bug": 0, "rubric-bug": 0, "scorer-error": 0 };
  data.adjudications.forEach((record) => {
    counts[record.classification] += 1;
  });
  if (classifications.some((key) => counts[key] !== data.summaryCounts[key]))
    add("summaryCounts", "summaryCounts must agree with adjudications");
  if (issues.length) return { success: false, error: new z.ZodError(issues) };
  return { success: true, data };
}

export function flattenZodErrors(error) {
  return error.issues.map(
    (issue) => `${issue.path.join(".") || "document"}: ${issue.message}`,
  );
}
