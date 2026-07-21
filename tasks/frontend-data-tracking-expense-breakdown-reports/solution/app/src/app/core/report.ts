import type { Filters, Transaction } from './model';
import { fmtDate, money, pct, signedMoney } from './format';

export interface BurnSummary {
  ceiling: number;
  monthToDate: number;
  projectedMonthEnd: number;
  over: boolean;
}

export interface ReportInput {
  transactions: Transaction[];
  filters: Filters;
  burn: BurnSummary;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeTotals(transactions: Transaction[]) {
  const income = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const net = income - expenses;
  return {
    income: round2(income),
    expenses: round2(expenses),
    net: round2(net),
    savingsRate: income > 0 ? round2((net / income) * 100) : 0,
    count: transactions.length,
  };
}

export function computeCategoryBreakdown(transactions: Transaction[]) {
  const expenses = transactions.filter((t) => t.amount < 0);
  const total = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
  const byCategory = new Map<string, { amount: number; count: number; last: Transaction }>();
  for (const t of expenses) {
    const entry = byCategory.get(t.category);
    if (!entry) {
      byCategory.set(t.category, { amount: Math.abs(t.amount), count: 1, last: t });
    } else {
      entry.amount += Math.abs(t.amount);
      entry.count += 1;
      if (t._ts >= entry.last._ts) entry.last = t;
    }
  }
  return [...byCategory.entries()]
    .map(([category, v]) => ({
      category,
      amount: round2(v.amount),
      share: total > 0 ? v.amount / total : 0,
      count: v.count,
      last: v.last,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Pretty JSON with two-decimal currency treatment. Numeric currency leaves are
 * emitted as fixed-decimal JSON number literals so the preview matches the
 * decimal treatment used across the UI while remaining valid, parseable JSON.
 */
function stringifyJson(value: unknown, depth = 0): string {
  const pad = '  '.repeat(depth);
  const padIn = '  '.repeat(depth + 1);
  if (value === null) return 'null';
  if (typeof value === 'number') return value.toFixed(2);
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((v) => `${padIn}${stringifyJson(v, depth + 1)}`);
    return `[\n${items.join(',\n')}\n${pad}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    const lines = entries.map(([k, v]) => `${padIn}${JSON.stringify(k)}: ${stringifyJson(v, depth + 1)}`);
    return `{\n${lines.join(',\n')}\n${pad}}`;
  }
  return String(value);
}

export function buildJsonReport({ transactions, filters, burn }: ReportInput): string {
  const totals = computeTotals(transactions);
  const breakdown = computeCategoryBreakdown(transactions);
  const report = {
    version: 1,
    reportTitle: 'Expense Breakdown',
    generatedAt: new Date().toISOString(),
    filters: {
      category: filters.category,
      type: filters.type,
      dateStart: filters.dateStart,
      dateEnd: filters.dateEnd,
      payeeQuery: filters.payee ?? '',
    },
    totals: {
      income: totals.income,
      expenses: totals.expenses,
      net: totals.net,
      savingsRate: totals.savingsRate,
      count: totals.count,
    },
    burnRate: {
      ceiling: burn.ceiling,
      monthToDate: burn.monthToDate,
      projectedMonthEnd: burn.projectedMonthEnd,
      over: burn.over,
    },
    categoryBreakdown: breakdown.map((b) => ({ category: b.category, amount: b.amount, share: b.share })),
    transactions: transactions.map((t) => ({
      date: t.date,
      payee: t.payee,
      category: t.category,
      account: t.account,
      amount: round2(t.amount),
      status: t.status ?? '',
    })),
  };
  return `${stringifyJson(report)}\n`;
}

export function buildMarkdownReport({ transactions, filters, burn }: ReportInput): string {
  const totals = computeTotals(transactions);
  const breakdown = computeCategoryBreakdown(transactions);
  const lines: string[] = [];
  lines.push('# Expense Breakdown Report');
  lines.push('');
  lines.push(`_Generated ${fmtDate(new Date().toISOString().slice(0, 10))} · Ledger demo data · Scope: ${scopeLabel(filters)}_`);
  lines.push('');
  lines.push('## Totals');
  lines.push('');
  lines.push(`- Income: ${money(totals.income)}`);
  lines.push(`- Expenses: ${money(totals.expenses)}`);
  lines.push(`- Net income: ${signedMoney(totals.net)}`);
  lines.push(`- Savings rate: ${totals.income > 0 ? pct(totals.savingsRate / 100) : '—'}`);
  lines.push(`- Transactions: ${totals.count}`);
  lines.push('');
  lines.push('## Category breakdown');
  lines.push('');
  if (breakdown.length === 0) {
    lines.push('No expense activity in the current scope.');
  } else {
    lines.push('| Category | Amount | Share of expenses |');
    lines.push('| --- | ---: | ---: |');
    for (const b of breakdown) {
      lines.push(`| ${b.category} | ${money(b.amount)} | ${pct(b.share)} |`);
    }
  }
  lines.push('');
  lines.push('## Burn rate');
  lines.push('');
  lines.push(`- Monthly ceiling: ${money(burn.ceiling)}`);
  lines.push(`- Month to date: ${money(burn.monthToDate)}`);
  lines.push(`- Projected month-end: ${money(burn.projectedMonthEnd)}`);
  lines.push(
    `- Status: ${
      burn.over
        ? `Over ceiling by ${money(burn.projectedMonthEnd - burn.ceiling)}`
        : `Under ceiling by ${money(burn.ceiling - burn.projectedMonthEnd)}`
    }`,
  );
  lines.push('');
  lines.push('## Transactions');
  lines.push('');
  if (transactions.length === 0) {
    lines.push('No transactions in the current scope.');
  } else {
    lines.push('| Date | Payee | Category | Account | Amount | Status |');
    lines.push('| --- | --- | --- | --- | ---: | --- |');
    for (const t of transactions) {
      lines.push(
        `| ${fmtDate(t.date)} | ${t.payee} | ${t.category} | ${t.account} | ${signedMoney(t.amount)} | ${t.status ?? '—'} |`,
      );
    }
  }
  lines.push('');
  return lines.join('\n');
}

function scopeLabel(filters: Filters): string {
  const parts: string[] = [];
  if (filters.category) parts.push(filters.category);
  if (filters.type) parts.push(filters.type === 'income' ? 'Income only' : 'Expenses only');
  if (filters.dateStart || filters.dateEnd) {
    parts.push(`${filters.dateStart ?? '…'} → ${filters.dateEnd ?? '…'}`);
  }
  if (filters.payee) parts.push(`payee “${filters.payee}”`);
  return parts.length ? parts.join(' · ') : 'all transactions';
}
