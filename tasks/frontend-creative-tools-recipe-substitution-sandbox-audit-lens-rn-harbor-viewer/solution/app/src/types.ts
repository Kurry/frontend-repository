import { z } from 'zod';

export const StatusEnum = z.enum(['empty', 'draft', 'ready', 'changed', 'archived']);
export type Status = z.infer<typeof StatusEnum>;

export const IngredientRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  status: StatusEnum,
  evidence: z.string().optional(),
  discrepancy: z.string().optional(),
  order: z.number()
});
export type IngredientRecord = z.infer<typeof IngredientRecordSchema>;

export const DerivedStateSchema = z.object({
  totalQuantity: z.number(),
  readyCount: z.number(),
  conflictCount: z.number(),
  summary: z.string()
});
export type DerivedState = z.infer<typeof DerivedStateSchema>;

export const SessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string().datetime(),
  records: z.array(IngredientRecordSchema).refine((records) => {
    const ids = records.map(r => r.id);
    return new Set(ids).size === ids.length;
  }, { message: "Duplicate IDs are not allowed" }),
  derived: DerivedStateSchema,
  history: z.array(
    z.object({
      action: z.string(),
      timestamp: z.string().datetime()
    })
  )
});
export type Session = z.infer<typeof SessionSchema>;
