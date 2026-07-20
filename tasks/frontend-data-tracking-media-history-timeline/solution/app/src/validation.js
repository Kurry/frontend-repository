import { z } from 'zod';
import { EVENT_TYPES, MT_DATA } from './data.js';

const categoryIds = MT_DATA.categories.map(category => category.id);
const categorySchema = z.enum(categoryIds);

export const historyEventSchema = z.object({
  title: z.string().trim().min(1).max(120),
  type: z.enum(EVENT_TYPES),
  timestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
  mediaRefs: z.array(z.string().trim().min(1).max(64)).min(1).max(6),
  year: z.number().int().min(MT_DATA.yearMin).max(MT_DATA.yearMax),
  place: z.string().trim().min(1).max(80),
  categories: z.array(categorySchema).min(1),
  summary: z.string().trim().min(1).max(2000),
  detail: z.string().trim().min(1).max(4000),
}).superRefine((event, context) => {
  const isValidTimestamp = !Number.isNaN(Date.parse(event.timestamp));
  const timestampMatchesYear = event.year < 1
    ? event.timestamp === '0001-01-01T00:00:00.000Z'
    : Number(event.timestamp.slice(0, 4)) === event.year;

  if (!isValidTimestamp || !timestampMatchesYear) {
    context.addIssue({
      code: 'custom',
      path: ['timestamp'],
      message: 'timestamp must match year and end with Z',
    });
  }
});

export const timelinePackSchema = z.object({
  version: z.literal(1),
  document: z.literal('media-history-timeline'),
  yearWindow: z.object({
    from: z.number().min(MT_DATA.yearMin).max(MT_DATA.yearMax),
    to: z.number().min(MT_DATA.yearMin).max(MT_DATA.yearMax),
  }).refine(window => window.to - window.from >= 50, {
    path: ['to'],
    message: 'yearWindow must keep a minimum gap of 50 years',
  }),
  activeCategories: z.array(categorySchema),
  search: z.string(),
  events: z.array(historyEventSchema),
  totals: z.object({
    eventCount: z.number().int().nonnegative(),
    byCategory: z.array(z.object({
      category: categorySchema,
      count: z.number().int().nonnegative(),
    })).length(categoryIds.length),
  }),
}).superRefine((pack, context) => {
  if (pack.totals.eventCount !== pack.events.length) {
    context.addIssue({
      code: 'custom',
      path: ['totals', 'eventCount'],
      message: 'totals.eventCount must match events length',
    });
  }

  const expectedCounts = Object.fromEntries(categoryIds.map(category => [category, 0]));
  pack.events.forEach(event => event.categories.forEach(category => { expectedCounts[category] += 1; }));
  const importedCounts = Object.fromEntries(pack.totals.byCategory.map(item => [item.category, item.count]));
  categoryIds.forEach(category => {
    if (importedCounts[category] !== expectedCounts[category]) {
      context.addIssue({
        code: 'custom',
        path: ['totals', 'byCategory'],
        message: `totals.byCategory is invalid for ${category}`,
      });
    }
  });
});

export function formatImportError(error) {
  const issue = error.issues[0];
  const field = issue.path.length ? issue.path.join('.') : 'document';
  return `Import ${field}: ${issue.message}`;
}
