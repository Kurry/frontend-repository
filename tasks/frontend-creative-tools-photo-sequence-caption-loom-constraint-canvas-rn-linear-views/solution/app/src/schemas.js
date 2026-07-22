import { z } from 'zod';

export const sequenceStatusEnum = z.enum(['empty', 'draft', 'ready', 'changed', 'archived']);
export const canvasStateEnum = z.enum(['idle', 'selected', 'changed', 'conflict', 'resolved']);

export const photoSequenceRecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  status: sequenceStatusEnum,
  canvasState: canvasStateEnum,
});

export const photoSequenceCaptionLoomSessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string().datetime(),
  records: z.array(photoSequenceRecordSchema),
  derived: z.object({
    summary: z.string(),
    stats: z.record(z.string(), z.number()),
  }),
  history: z.array(
    z.object({
      action: z.string(),
      timestamp: z.string().datetime(),
      details: z.any(),
    })
  ),
});
