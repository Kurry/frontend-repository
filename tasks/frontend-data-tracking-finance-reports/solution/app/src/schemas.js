import { z } from 'zod';

export const CATEGORIES = [
  'Groceries',
  'Restaurants',
  'Transport',
  'Housing',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Salary',
  'Freelance',
];

export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c !== 'Salary' && c !== 'Freelance');
export const INCOME_CATEGORIES = ['Salary', 'Freelance'];

export const ACCOUNTS = ['Checking', 'Savings', 'Credit Card', 'Cash'];
export const STATUSES = ['cleared', 'pending', 'reconciled'];
export const CURRENCIES = ['USD', 'EUR', 'GBP'];

// Mock FX rates relative to a USD base (USD = identity). Stored amounts are USD.
export const FX = { USD: 1, EUR: 0.92, GBP: 0.78 };
export const CURRENCY_SYMBOL = { USD: '$', EUR: '€', GBP: '£' };

// Per-category visual identity: emoji prefix + stable multi-hue fill.
export const CATEGORY_META = {
  Groceries: { emoji: '🛒', label: 'Groceries', color: '#ec4899' },
  Restaurants: { emoji: '🍽️', label: 'Restaurants & Bars', color: '#f59e0b' },
  Transport: { emoji: '🚗', label: 'Gas & Transport', color: '#3b82f6' },
  Housing: { emoji: '🏠', label: 'Housing', color: '#8b5cf6' },
  Utilities: { emoji: '💡', label: 'Utilities', color: '#14b8a6' },
  Entertainment: { emoji: '🎬', label: 'Entertainment', color: '#ef4444' },
  Healthcare: { emoji: '🩺', label: 'Healthcare', color: '#06b6d4' },
  Shopping: { emoji: '🛍️', label: 'Shopping', color: '#a855f7' },
  Salary: { emoji: '💼', label: 'Salary', color: '#6366f1' },
  Freelance: { emoji: '💻', label: 'Business Income', color: '#10b981' },
};

export function isIncomeCategory(category) {
  return category === 'Salary' || category === 'Freelance';
}

// Income-source node names used on the Breakdown sankey left side.
export function incomeSourceName(category) {
  return category === 'Freelance' ? 'Business Income' : 'Paychecks';
}

const ISO_DATE = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
function isRealIsoDate(s) {
  if (!ISO_DATE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function twoDecimals(n) {
  return Math.round(n * 100) / 100 === n;
}

export const transactionSchema = z
  .object({
    date: z
      .string()
      .trim()
      .refine((v) => v.length > 0, 'Date is required')
      .refine((v) => isRealIsoDate(v), 'Date must be a valid ISO date (YYYY-MM-DD)'),
    label: z
      .string()
      .refine((v) => v.trim().length >= 1, 'Payee is required')
      .refine((v) => v.trim().length <= 80, 'Payee must be 80 characters or fewer')
      .transform((v) => v.trim()),
    category: z.enum(CATEGORIES, {
      errorMap: () => ({ message: 'Category must be one of the allowed categories' }),
    }),
    account: z.enum(ACCOUNTS, {
      errorMap: () => ({ message: 'Account must be one of the allowed accounts' }),
    }),
    amount: z
      .string()
      .trim()
      .refine((v) => v.length > 0, 'Amount is required')
      .refine((v) => !Number.isNaN(Number(v)), 'Amount must be a number')
      .refine((v) => Number(v) !== 0, 'Amount cannot be zero')
      .refine((v) => Math.abs(Number(v)) <= 1000000, 'Amount must be at most 1,000,000')
      .refine((v) => twoDecimals(Number(v)), 'Amount allows at most 2 decimal places'),
    status: z.string().optional().nullable(),
    note: z.string().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    const amt = Number(val.amount);
    if (!Number.isNaN(amt)) {
      const income = isIncomeCategory(val.category);
      if (income && amt < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amount'],
          message: `${val.category} is an income category and requires a positive amount`,
        });
      }
      if (!income && amt > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amount'],
          message: `${val.category} is an expense category and requires a negative amount`,
        });
      }
    }
    const st = val.status;
    if (st !== undefined && st !== null && st !== '' && !STATUSES.includes(st)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['status'],
        message: 'Status must be cleared, pending, or reconciled',
      });
    }
    if (val.note && val.note.length > 200) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['note'],
        message: 'Note must be 200 characters or fewer',
      });
    }
  });

// Numeric, fully-validated transaction record (post-parse), used by WebMCP + import.
export const transactionRecordSchema = z
  .object({
    date: z.string().refine((v) => isRealIsoDate(v), 'date must be ISO YYYY-MM-DD'),
    label: z.string().refine((v) => v.trim().length >= 1 && v.trim().length <= 80, 'label must be 1-80 chars'),
    category: z.enum(CATEGORIES),
    account: z.enum(ACCOUNTS),
    amount: z
      .number()
      .refine((n) => n !== 0 && Math.abs(n) <= 1000000 && twoDecimals(n), 'amount out of range or precision'),
    status: z.enum(STATUSES).or(z.literal('')),
    note: z.string().max(200),
  })
  .superRefine((t, ctx) => {
    const income = isIncomeCategory(t.category);
    if (income && t.amount < 0)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: `${t.category} requires a positive amount` });
    if (!income && t.amount > 0)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: `${t.category} requires a negative amount` });
  })
  .strict();

export const thresholdSchema = z
  .object({
    category: z.enum(EXPENSE_CATEGORIES),
    ceiling: z
      .number()
      .refine((n) => n > 0 && n <= 1000000 && twoDecimals(n), 'ceiling must be > 0, ≤ 1,000,000, ≤ 2 decimals'),
    monthToDate: z.number().nonnegative(),
    status: z.enum(['under', 'near', 'over']),
  })
  .strict()
  .superRefine((threshold, context) => {
    const expected = threshold.monthToDate > threshold.ceiling ? 'over' : threshold.monthToDate >= threshold.ceiling * 0.8 ? 'near' : 'under';
    if (threshold.status !== expected) context.addIssue({ code: 'custom', path: ['status'], message: `status must be ${expected} for this ceiling and monthToDate` });
  });

// Threshold ceiling as entered in the UI (text input -> validated number).
export const ceilingInputSchema = z
  .string()
  .trim()
  .refine((v) => v.length > 0, 'Ceiling is required')
  .refine((v) => !Number.isNaN(Number(v)), 'Ceiling must be a number')
  .refine((v) => Number(v) > 0, 'Ceiling must be greater than 0')
  .refine((v) => Number(v) <= 1000000, 'Ceiling must be at most 1,000,000')
  .refine((v) => twoDecimals(Number(v)), 'Ceiling allows at most 2 decimal places');

const nullableDate = z.string().refine(isRealIsoDate, 'must be an ISO date (YYYY-MM-DD)').nullable();

export const ledgerSchema = z.object({
  schemaVersion: z.literal(1),
  reportTitle: z.literal('Finance Reports'),
  generatedAt: z.iso.datetime({ offset: false }),
  displayCurrency: z.enum(CURRENCIES),
  filters: z
    .object({
      category: z.enum(CATEGORIES).nullable(),
      type: z.enum(['income', 'expense']).nullable(),
      dateStart: nullableDate,
      dateEnd: nullableDate,
    })
    .strict()
    .refine((value) => !value.dateStart || !value.dateEnd || value.dateStart <= value.dateEnd, { path: ['dateEnd'], message: 'must not be before dateStart' }),
  totals: z.object({
    income: z.number(), expenses: z.number(), net: z.number(), savingsRate: z.number(), count: z.number().int().nonnegative(),
  }).strict(),
  thresholds: z.array(thresholdSchema),
  transactions: z.array(transactionRecordSchema),
}).strict().superRefine((ledger, context) => {
  if (ledger.totals.count !== ledger.transactions.length) context.addIssue({ code: 'custom', path: ['totals', 'count'], message: 'must equal transactions.length' });
});

export { isRealIsoDate, twoDecimals };
