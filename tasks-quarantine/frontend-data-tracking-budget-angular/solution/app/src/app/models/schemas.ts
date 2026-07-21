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
  recurring: z.boolean()
}).superRefine((expense, ctx) => {
  const [year, month] = expense.datetime.split('-').map(Number);
  if (expense.period.year !== year || expense.period.month !== month) {
    ctx.addIssue({
      code: 'custom',
      path: ['period'],
      message: 'period must match datetime month and year'
    });
  }
});

export const ExpenseFormSchema = z.object({
  value: z.number().positive("Amount must be a positive number"),
  datetime: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  categoryId: z.string().min(1, 'Category is required'),
  counterparty: z.string().optional().nullable()
});

export const CategoryNameSchema = z
  .string()
  .trim()
  .min(1, 'Category name is required')
  .max(40, 'Category name must be 40 characters or fewer');

export const DisplayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name is required')
  .max(60, 'Display name must be 60 characters or fewer');

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  counterpartyPatterns: z.array(z.string()),
  maxExpenses: z.number().nonnegative(),
  limit: z.number().nonnegative(),
  spent: z.number(),
  variance: z.number(),
  projected: z.number(),
  overThreshold: z.boolean()
}).superRefine((category, ctx) => {
  if (category.maxExpenses !== category.limit) {
    ctx.addIssue({ code: 'custom', path: ['limit'], message: 'limit must equal maxExpenses' });
  }
});

export const RecurringRuleSchema = z.object({
  name: z.string().trim().min(1, 'Rule name is required').max(60, 'Rule name must be 60 characters or fewer'),
  value: z.number().positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  dayOfMonth: z.number().int('Day of month must be an integer').min(1, 'Day of month must be between 1 and 28').max(28, 'Day of month must be between 1 and 28')
});

const nearlyEqual = (left: number, right: number) => Math.abs(left - right) < 0.005;

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
    month: z.number().int().min(1).max(12),
    year: z.number().int()
  }),
  settings: z.object({
    thresholdPercent: z.number().int().min(0).max(100),
    accountName: z.string()
  }),
  categories: z.array(CategorySchema),
  recurringRules: z.array(RecurringRuleSchema),
  expenses: z.array(ExpenseSchema)
}).superRefine((document, ctx) => {
  const categoryIds = new Set(document.categories.map(category => category.id));
  document.expenses.forEach((expense, index) => {
    if (!categoryIds.has(expense.categoryId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['expenses', index, 'categoryId'],
        message: 'categoryId must reference an existing category'
      });
    }
  });

  if (document.meta.expenseCount !== document.expenses.length) {
    ctx.addIssue({ code: 'custom', path: ['meta', 'expenseCount'], message: 'meta.expenseCount must equal expenses length' });
  }
  if (document.settings.accountName !== document.displayName) {
    ctx.addIssue({ code: 'custom', path: ['settings', 'accountName'], message: 'settings.accountName must equal displayName' });
  }

  const periodExpenses = document.expenses.filter(expense =>
    expense.period.month === document.activePeriod.month && expense.period.year === document.activePeriod.year
  );
  const expectedBudget = document.categories.reduce((sum, category) => sum + category.limit, 0);
  const expectedSpent = periodExpenses.reduce((sum, expense) => sum + expense.value, 0);
  const expectedLeft = expectedBudget - expectedSpent;
  const totalChecks = [
    ['budget', expectedBudget],
    ['spent', expectedSpent],
    ['left', expectedLeft]
  ] as const;
  totalChecks.forEach(([field, expected]) => {
    if (!nearlyEqual(document.totals[field], expected)) {
      ctx.addIssue({ code: 'custom', path: ['totals', field], message: `totals.${field} disagrees with categories and expenses` });
    }
  });

  document.categories.forEach((category, index) => {
    const expectedCategorySpent = periodExpenses
      .filter(expense => expense.categoryId === category.id)
      .reduce((sum, expense) => sum + expense.value, 0);
    if (!nearlyEqual(category.spent, expectedCategorySpent)) {
      ctx.addIssue({ code: 'custom', path: ['categories', index, 'spent'], message: 'category spent disagrees with expenses' });
    }
    if (!nearlyEqual(category.variance, category.limit - expectedCategorySpent)) {
      ctx.addIssue({ code: 'custom', path: ['categories', index, 'variance'], message: 'category variance disagrees with limit and spent' });
    }
    const expectedOverThreshold = category.limit > 0 && expectedCategorySpent >= category.limit * (document.settings.thresholdPercent / 100);
    if (category.overThreshold !== expectedOverThreshold) {
      ctx.addIssue({ code: 'custom', path: ['categories', index, 'overThreshold'], message: 'category overThreshold disagrees with spent and thresholdPercent' });
    }
  });
});

export const ThresholdSchema = z.number().int().min(0).max(100);
