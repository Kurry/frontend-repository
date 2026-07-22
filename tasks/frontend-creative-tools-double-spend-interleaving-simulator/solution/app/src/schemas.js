import { z } from 'zod';

export const DecisionSchema = z.object({
  id: z.string(),
  strategy_mode: z.enum(['none', 'optimistic-version', 'pessimistic-lock', 'serializable']),
  conflict_edge: z.string().optional(),
  decision_type: z.enum(['wait', 'abort_retry', 'reorder', 'cancel']).optional(),
  phase_reorder: z.object({
    txId: z.string(),
    phaseId: z.string(),
    newSlot: z.number().int().min(1).max(24)
  }).optional()
});

export const PhaseSchema = z.object({
  id: z.string(),
  txId: z.string(),
  type: z.enum(['begin', 'read', 'validate', 'debit', 'credit', 'commit']),
  slot: z.number().int().min(1).max(24).nullable(), // null means unscheduled
  account: z.string().optional(),
  amount: z.number().optional()
});

export const TransactionSchema = z.object({
  id: z.string(),
  attempt: z.number().int().min(0),
  phases: z.array(PhaseSchema),
  amount: z.number(),
  fromAccount: z.string(),
  toAccount: z.string(),
  status: z.enum(['pending', 'running', 'waiting', 'conflicted', 'rolled-back', 'committed', 'invalid', 'cancelled'])
});

export const ScenarioSchema = z.object({
  schemaVersion: z.literal("transaction-interleaving/v1"),
  id: z.string(),
  name: z.string(),
  strategy: z.enum(['none', 'optimistic-version', 'pessimistic-lock', 'serializable']),
  transactions: z.array(TransactionSchema),
  decisions: z.array(DecisionSchema),
  annotations: z.string().optional(),
  exportedAt: z.string()
});
