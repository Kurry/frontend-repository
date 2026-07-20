import { z } from 'zod';

export const annotationCreateSchema = z.object({
  bodyMarkdown: z.string().trim().min(1, 'bodyMarkdown is required.').max(4000, 'bodyMarkdown must be 4000 characters or fewer.'),
  lineStart: z.coerce.number().int().min(1, 'lineStart must be an integer greater than or equal to 1.'),
  lineEnd: z.coerce.number().int().min(1, 'lineEnd must be an integer greater than or equal to 1.'),
  author: z.string().trim().min(1, 'author is required.').max(80, 'author must be 80 characters or fewer.'),
}).superRefine((value, context) => {
  if (value.lineEnd < value.lineStart) context.addIssue({ code: 'custom', path: ['lineEnd'], message: 'lineEnd must be greater than or equal to lineStart.' });
});

export const annotationReplySchema = z.object({
  bodyMarkdown: z.string().trim().min(1, 'bodyMarkdown is required.').max(4000, 'bodyMarkdown must be 4000 characters or fewer.'),
});

export const restoreCreateSchema = z.object({
  sourceVersionId: z.string().min(1, 'sourceVersionId is required.'),
  changeNote: z.string().min(1, 'changeNote is required and must name the restore source version.').max(200, 'changeNote must be 200 characters or fewer.'),
});

export const mergeRegionResolutionSchema = z.object({
  regionId: z.string().min(1, 'regionId is required.'),
  resolution: z.enum(['choose-left', 'choose-right', 'edit-manually'], { message: 'resolution must be choose-left, choose-right, or edit-manually.' }),
  manualText: z.string().nullable().optional(),
}).superRefine((value, context) => {
  if (value.resolution === 'edit-manually' && typeof value.manualText !== 'string') {
    context.addIssue({ code: 'custom', path: ['manualText'], message: 'manualText is required as a string for edit-manually.' });
  }
  if (value.resolution !== 'edit-manually' && value.manualText != null) {
    context.addIssue({ code: 'custom', path: ['manualText'], message: 'manualText must be null or omitted for choose-left and choose-right.' });
  }
});

export const versionRecordSchema = z.object({
  versionId: z.string().min(1, 'versionId is required.'),
  versionNumber: z.number().int().min(1, 'versionNumber must be at least 1.'),
  author: z.string().min(1, 'author is required.').max(80, 'author must be 80 characters or fewer.'),
  timestamp: z.string().refine((value) => !Number.isNaN(Date.parse(value)) && /(Z|[+-]\d\d:\d\d)$/.test(value), 'timestamp must be an ISO-8601 datetime ending with Z or an explicit offset.'),
  changeNote: z.string().min(1, 'changeNote is required.').max(500, 'changeNote must be 500 characters or fewer.'),
  text: z.string(),
  kind: z.enum(['main', 'branch', 'merge', 'restore'], { message: 'kind must be one of main, branch, merge, or restore.' }),
  parentIds: z.array(z.string().min(1)).max(2, 'parentIds must contain zero to two versionId strings.'),
}).superRefine((value, context) => {
  if (value.kind === 'merge' && value.parentIds.length !== 2) context.addIssue({ code: 'custom', path: ['parentIds'], message: 'parentIds must contain exactly two entries when kind is merge.' });
});

export const annotationRecordSchema = z.object({
  annotationId: z.string().min(1),
  bodyMarkdown: z.string().min(1).max(4000),
  lineStart: z.number().int().min(1),
  lineEnd: z.number().int().min(1),
  author: z.string().min(1).max(80),
  resolved: z.boolean(),
  replies: z.array(z.object({ bodyMarkdown: z.string().min(1).max(4000), author: z.string().min(1).max(80) })),
}).superRefine((value, context) => {
  if (value.lineEnd < value.lineStart) context.addIssue({ code: 'custom', path: ['lineEnd'], message: 'lineEnd must be greater than or equal to lineStart.' });
});

export const mergeSummarySchema = z.object({
  mergeVersionId: z.string().min(1),
  leftBranchVersionId: z.string().min(1),
  rightBranchVersionId: z.string().min(1),
  resolutions: z.array(mergeRegionResolutionSchema).min(1, 'resolutions must contain at least one MergeRegionResolution.'),
});

export const versionPackageSchema = z.object({
  schemaVersion: z.literal('prompt-diff-package-v1', { message: 'schemaVersion must be exactly prompt-diff-package-v1.' }),
  promptId: z.string().min(1, 'promptId is required.'),
  promptTitle: z.string().min(1, 'promptTitle is required.').max(120, 'promptTitle must be 120 characters or fewer.'),
  versions: z.array(versionRecordSchema).min(1, 'versions must contain at least one VersionRecord.'),
  baseVersionId: z.string().min(1, 'baseVersionId is required.'),
  compareVersionId: z.string().min(1, 'compareVersionId is required.'),
  counters: z.object({
    linesAdded: z.number().int().min(0, 'counters.linesAdded must be at least 0.'),
    linesRemoved: z.number().int().min(0, 'counters.linesRemoved must be at least 0.'),
    netTokenDelta: z.number().int('counters.netTokenDelta must be an integer.'),
  }),
  annotations: z.array(annotationRecordSchema),
  merge: mergeSummarySchema.nullable().optional(),
}).superRefine((value, context) => {
  const ids = new Set(value.versions.map((version) => version.versionId));
  value.versions.forEach((version, index) => version.parentIds.forEach((parentId) => {
    if (!ids.has(parentId)) context.addIssue({ code: 'custom', path: ['versions', index, 'parentIds'], message: `parentIds entry ${parentId} must reference a versionId present in versions.` });
  }));
  if (!ids.has(value.baseVersionId)) context.addIssue({ code: 'custom', path: ['baseVersionId'], message: 'baseVersionId must match a versions[].versionId.' });
  if (!ids.has(value.compareVersionId)) context.addIssue({ code: 'custom', path: ['compareVersionId'], message: 'compareVersionId must match a versions[].versionId.' });
  if (value.merge) {
    const mergeVersion = value.versions.find((version) => version.versionId === value.merge.mergeVersionId);
    if (!mergeVersion || mergeVersion.kind !== 'merge') context.addIssue({ code: 'custom', path: ['merge', 'mergeVersionId'], message: 'merge.mergeVersionId must match a versions[].versionId whose kind is merge.' });
  }
});

export function formatZodError(error) {
  const issue = error?.issues?.[0];
  if (!issue) return 'Import payload is invalid.';
  const path = issue.path?.length ? `${issue.path.join('.')}: ` : '';
  return `${path}${issue.message}`;
}

