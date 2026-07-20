import { z } from 'zod';

export const ExpenseSchema = z.object({
  id: z.string(),
  value: z.number().positive(),
  datetime: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  categoryId: z.string().min(1),
  counterparty: z.string(),
  period: z.object({
    month: z.number().min(1).max(12),
    year: z.number()
  }),
  recurring: z.boolean().optional()
});

export const ExpenseFormSchema = z.object({
  value: z.number().positive("Amount must be a positive number"),
  datetime: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  categoryId: z.string().min(1, 'Category is required'),
  counterparty: z.string().optional().nullable()
});

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  counterpartyPatterns: z.array(z.string()),
  limit: z.number().optional(),
  spent: z.number().optional(),
  variance: z.number().optional(),
  projected: z.number().optional(),
  overThreshold: z.boolean().optional()
});

export const RecurringRuleSchema = z.object({
  name: z.string(),
  value: z.number().positive(),
  categoryId: z.string(),
  dayOfMonth: z.number().min(1).max(31)
});

export const BudgetDocumentSchema = z.object({
  meta: z.object({
    exportedAt: z.string(),
    period: z.string(),
    expenseCount: z.number()
  }),
  totals: z.object({
    budget: z.number(),
    spent: z.number(),
    left: z.number()
  }),
  displayName: z.string(),
  activePeriod: z.object({
    month: z.number(),
    year: z.number()
  }),
  settings: z.object({
    thresholdPercent: z.number().int().min(0).max(100),
    accountName: z.string()
  }),
  categories: z.array(CategorySchema),
  recurringRules: z.array(RecurringRuleSchema),
  expenses: z.array(ExpenseSchema)
});

export const ThresholdSchema = z.number().int().min(0).max(100);
