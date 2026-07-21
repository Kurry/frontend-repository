import { z } from 'zod';
import { ACCOUNTS, CATEGORIES, INCOME_CATEGORIES, STATUSES, genId } from './model';
import type { Transaction, TxStatus } from './model';

export type FieldKey = 'date' | 'payee' | 'category' | 'account' | 'amount' | 'status';

export interface FieldError {
  field: FieldKey;
  message: string;
}

export interface RawTx {
  date: string;
  payee: string;
  category: string;
  account: string;
  amount: number | null;
  /** Raw status string; validated at runtime against the closed set. */
  status?: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(iso: string): boolean {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/**
 * Zod schema mirroring the transaction field contract. The schema defines the
 * rules; forms and WebMCP surface the same per-field errors from it.
 */
const txSchema = z
  .object({
    date: z
      .string()
      .regex(ISO_DATE, 'Date must be an ISO calendar date (YYYY-MM-DD)')
      .refine(isRealDate, 'Date must be a real calendar date'),
    payee: z
      .string()
      .trim()
      .min(1, 'Payee is required')
      .max(80, 'Payee must be 80 characters or fewer'),
    category: z
      .string()
      .min(1, 'Category is required')
      .refine((c) => (CATEGORIES as readonly string[]).includes(c), 'Category must be one of the ledger categories'),
    account: z
      .string()
      .min(1, 'Account is required')
      .refine(
        (a) => (ACCOUNTS as readonly string[]).includes(a),
        'Account must be one of Checking, Savings, Credit Card, or Cash',
      ),
    amount: z
      .number()
      .refine((a) => Number.isFinite(a), 'Amount is required')
      .refine((a) => a !== 0, 'Amount must not be zero')
      .refine((a) => Math.abs(a) <= 1_000_000, 'Amount must be at most 1,000,000')
      .refine(
        (a) => Math.abs(Math.round(a * 100) - a * 100) < 1e-6,
        'Amount may have at most two decimal places',
      ),
    status: z
      .string()
      .optional()
      .refine(
        (s) => s === undefined || s === '' || (STATUSES as readonly string[]).includes(s),
        'Status must be cleared, pending, or reconciled',
      ),
  })
  .superRefine((v, ctx) => {
    if (Number.isFinite(v.amount) && v.amount !== 0) {
      if (INCOME_CATEGORIES.includes(v.category) && v.amount < 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['amount'],
          message: `${v.category} is an income category, so the amount must be positive`,
        });
      } else if (!INCOME_CATEGORIES.includes(v.category) && (CATEGORIES as readonly string[]).includes(v.category) && v.amount > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['amount'],
          message: `${v.category} is an expense category, so the amount must be negative`,
        });
      }
    }
  });

/** Validate a candidate record; returns per-field errors (empty array = valid). */
export function validateTransaction(raw: RawTx): FieldError[] {
  const candidate = {
    date: raw.date ?? '',
    payee: raw.payee ?? '',
    category: raw.category ?? '',
    account: raw.account ?? '',
    amount: raw.amount === null || raw.amount === undefined ? Number.NaN : raw.amount,
    status: raw.status === '' ? undefined : raw.status,
  };
  const result = txSchema.safeParse(candidate);
  if (result.success) return [];
  const errors: FieldError[] = [];
  for (const issue of result.error.issues) {
    const field = (issue.path[0] as FieldKey) ?? 'payee';
    if (!errors.some((e) => e.field === field && e.message === issue.message)) {
      errors.push({ field, message: issue.message });
    }
  }
  return errors;
}

export function toTransaction(raw: RawTx, base?: Transaction): Transaction {
  return {
    id: base?.id ?? genId(),
    date: raw.date,
    payee: raw.payee.trim(),
    category: raw.category,
    account: raw.account,
    amount: raw.amount ?? 0,
    status: raw.status === '' || raw.status === undefined ? undefined : (raw.status as TxStatus),
    _ts: Date.now(),
  };
}

/* ------------------------------------------------------------------ */
/* CSV import pipeline                                                 */
/* ------------------------------------------------------------------ */

export const CSV_HEADER = ['date', 'payee', 'category', 'account', 'amount', 'status'] as const;

export interface ImportRow {
  lineNo: number;
  cells: string[];
  candidate: RawTx;
  errors: FieldError[];
  /** Suggested per-field fixes the user can apply from the diagnostic panel. */
  fixes: Partial<Record<FieldKey, { value: string; hint: string }>>;
}

export interface ImportAnalysis {
  headerError: string | null;
  rows: ImportRow[];
  validCount: number;
}

function nearestCategory(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;
  let best: string | null = null;
  let bestScore = Infinity;
  for (const c of CATEGORIES) {
    const cl = c.toLowerCase();
    let score = Math.abs(cl.length - v.length);
    if (cl.startsWith(v) || v.startsWith(cl)) score -= 4;
    if (cl.includes(v) || v.includes(cl)) score -= 2;
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function coerceAmount(cell: string): number | null {
  const cleaned = cell.trim().replace(/[$,\s]/g, '').replace(/[−–—]/g, '-');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

function tryParseDate(cell: string): string | null {
  const t = cell.trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const iso = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    return isRealDate(iso) ? iso : null;
  }
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const iso = `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
    return isRealDate(iso) ? iso : null;
  }
  return null;
}

function buildFixes(candidate: RawTx, errors: FieldError[]): ImportRow['fixes'] {
  const fixes: ImportRow['fixes'] = {};
  for (const err of errors) {
    if (err.field === 'amount' && candidate.amount !== null && candidate.amount !== 0 && Number.isFinite(candidate.amount)) {
      if (INCOME_CATEGORIES.includes(candidate.category) && candidate.amount < 0) {
        fixes.amount = { value: String(Math.abs(candidate.amount)), hint: `Flip sign for ${candidate.category}` };
      } else if (!INCOME_CATEGORIES.includes(candidate.category) && candidate.amount > 0) {
        fixes.amount = { value: String(-candidate.amount), hint: `Flip sign for ${candidate.category}` };
      } else if (Math.abs(candidate.amount) > 1_000_000) {
        const capped = candidate.amount > 0 ? 1_000_000 : -1_000_000;
        fixes.amount = { value: String(capped), hint: 'Cap at the 1,000,000 limit' };
      } else if (Math.abs(Math.round(candidate.amount * 100) - candidate.amount * 100) >= 1e-6) {
        fixes.amount = { value: String(Math.round(candidate.amount * 100) / 100), hint: 'Round to two decimals' };
      }
    }
    if (err.field === 'category') {
      const near = nearestCategory(candidate.category);
      if (near) fixes.category = { value: near, hint: `Closest ledger category` };
    }
    if (err.field === 'date') {
      const parsed = tryParseDate(candidate.date);
      if (parsed) fixes.date = { value: parsed, hint: 'Convert to ISO date' };
    }
    if (err.field === 'status') {
      fixes.status = { value: 'cleared', hint: 'Default to cleared' };
    }
  }
  return fixes;
}

export function analyzeCsv(text: string): ImportAnalysis {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) {
    return {
      headerError: 'Nothing to import yet. Paste CSV rows with the header date,payee,category,account,amount,status.',
      rows: [],
      validCount: 0,
    };
  }
  const headerCells = lines[0].split(',').map((c) => c.trim().toLowerCase());
  const expected = [...CSV_HEADER];
  const headerOk =
    headerCells.length >= 5 &&
    expected.slice(0, 5).every((h, i) => headerCells[i] === h) &&
    (headerCells.length === 5 || headerCells[5] === 'status');
  if (!headerOk) {
    return {
      headerError:
        'Malformed header. Expected exactly: date,payee,category,account,amount,status. Nothing was changed.',
      rows: [],
      validCount: 0,
    };
  }
  const rows: ImportRow[] = lines.slice(1).map((line, i) => {
    const cells = line.split(',').map((c) => c.trim());
    const amount = coerceAmount(cells[4] ?? '');
    const candidate: RawTx = {
      date: cells[0] ?? '',
      payee: cells[1] ?? '',
      category: cells[2] ?? '',
      account: cells[3] ?? '',
      amount,
      status: cells[5] ?? '',
    };
    const errors = validateTransaction(candidate);
    return { lineNo: i + 2, cells, candidate, errors, fixes: buildFixes(candidate, errors) };
  });
  return { headerError: null, rows, validCount: rows.filter((r) => r.errors.length === 0).length };
}

export function applyRowFix(row: ImportRow, field: FieldKey): ImportRow {
  const fix = row.fixes[field];
  if (!fix) return row;
  const candidate: RawTx = { ...row.candidate };
  if (field === 'amount') candidate.amount = Number(fix.value);
  else if (field === 'status') candidate.status = fix.value as TxStatus;
  else candidate[field] = fix.value;
  const errors = validateTransaction(candidate);
  return { ...row, candidate, errors, fixes: buildFixes(candidate, errors) };
}

export function rowsToTransactions(rows: ImportRow[]): Transaction[] {
  return rows
    .filter((r) => r.errors.length === 0)
    .map((r, i) => ({ ...toTransaction(r.candidate), id: genId(), _ts: Date.now() + i }));
}

/** Serialize transactions to the import CSV shape (signed amounts). */
export function transactionsToCsv(txs: Transaction[]): string {
  const head = CSV_HEADER.join(',');
  const body = txs.map((t) =>
    [t.date, t.payee, t.category, t.account, t.amount.toFixed(2), t.status ?? ''].join(','),
  );
  return [head, ...body].join('\n');
}
