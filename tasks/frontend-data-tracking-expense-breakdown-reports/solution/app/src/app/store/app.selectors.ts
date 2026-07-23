import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { AppState, Filters, Transaction } from '../core/model';
import { computeCategoryBreakdown, computeTotals } from '../core/report';

export const selectAppState = createFeatureSelector<AppState>('app');

export function applyFilters(transactions: Transaction[], filters: Filters): Transaction[] {
  return transactions.filter((t) => {
    if (filters.category && t.category !== filters.category) return false;
    if (filters.type === 'income' && t.amount <= 0) return false;
    if (filters.type === 'expense' && t.amount >= 0) return false;
    if (filters.dateStart && t.date < filters.dateStart) return false;
    if (filters.dateEnd && t.date > filters.dateEnd) return false;
    if (filters.payee && !t.payee.toLowerCase().includes(filters.payee.toLowerCase())) return false;
    return true;
  });
}

export function sortTransactions(txs: Transaction[], sort: AppState['sort']): Transaction[] {
  const mul = sort.dir === 'asc' ? 1 : -1;
  return [...txs].sort((a, b) => {
    if (sort.key === 'amount') return (a.amount - b.amount) * mul || b._ts - a._ts;
    return (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) * mul || b._ts - a._ts;
  });
}

export const selectFilteredTransactions = createSelector(selectAppState, (s) =>
  applyFilters(s.transactions, s.filters),
);

export const selectVisibleTransactions = createSelector(selectAppState, (s) =>
  sortTransactions(applyFilters(s.transactions, s.filters), s.sort),
);

export const selectTotals = createSelector(selectFilteredTransactions, (txs) => computeTotals(txs));

export const selectCategoryBreakdown = createSelector(selectFilteredTransactions, (txs) =>
  computeCategoryBreakdown(txs),
);

export const selectIncomeSources = createSelector(selectFilteredTransactions, (txs) => {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.amount > 0) map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
});

export const selectSummaryStrip = createSelector(selectFilteredTransactions, (txs) => {
  if (txs.length === 0) {
    return { count: 0, largest: null as Transaction | null, average: 0, income: 0, first: null as string | null, last: null as string | null };
  }
  const income = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  let largest = txs[0];
  let first = txs[0];
  let last = txs[0];
  let sum = 0;
  for (const t of txs) {
    sum += t.amount;
    if (Math.abs(t.amount) > Math.abs(largest.amount)) largest = t;
    if (t.date < first.date) first = t;
    if (t.date > last.date) last = t;
  }
  return { count: txs.length, largest, average: sum / txs.length, income, first: first.date, last: last.date };
});

export interface BurnDay {
  day: number;
  label: string;
  amount: number;
}

export const selectBurnRate = createSelector(selectAppState, selectFilteredTransactions, (s, transactions) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const monthPrefix = `${y}-${String(m + 1).padStart(2, '0')}`;
  const daily = new Array<number>(daysInMonth).fill(0);
  for (const t of transactions) {
    if (t.amount < 0 && t.date.startsWith(monthPrefix)) {
      const day = Number(t.date.slice(8, 10));
      if (day >= 1 && day <= daysInMonth) daily[day - 1] += Math.abs(t.amount);
    }
  }
  const monthToDate = daily.reduce((a, b) => a + b, 0);
  const projectedMonthEnd = today > 0 ? (monthToDate / today) * daysInMonth : 0;
  let peak: BurnDay | null = null;
  const days: BurnDay[] = daily.map((amount, i) => {
    const d: BurnDay = { day: i + 1, label: `${now.toLocaleDateString('en-US', { month: 'short' })} ${i + 1}`, amount: Math.round(amount * 100) / 100 };
    if (amount > 0 && (!peak || amount > peak.amount)) peak = d;
    return d;
  });
  const pace = today > 0 ? monthToDate / today : 0;
  return {
    ceiling: s.ceiling,
    days,
    daysInMonth,
    today,
    monthToDate: Math.round(monthToDate * 100) / 100,
    projectedMonthEnd: Math.round(projectedMonthEnd * 100) / 100,
    pace: Math.round(pace * 100) / 100,
    peak: peak as BurnDay | null,
    over: projectedMonthEnd > s.ceiling,
    overage: Math.max(0, Math.round((projectedMonthEnd - s.ceiling) * 100) / 100),
  };
});

/** Cumulative daily series for the KPI sparklines (last 30 days, all transactions). */
export const selectSparklines = createSelector(selectAppState, (s) => {
  const days = 30;
  const end = new Date();
  const labels: string[] = [];
  const byDay = new Map<string, { income: number; expense: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i);
    const p = (n: number) => String(n).padStart(2, '0');
    labels.push(`${p(d.getMonth() + 1)}-${p(d.getDate())}`);
  }
  for (const t of s.transactions) {
    const bucket = byDay.get(t.date) ?? { income: 0, expense: 0 };
    if (t.amount > 0) bucket.income += t.amount;
    else bucket.expense += Math.abs(t.amount);
    byDay.set(t.date, bucket);
  }
  let cumIncome = 0;
  let cumExpense = 0;
  let cumNet = 0;
  const income: number[] = [];
  const expense: number[] = [];
  const net: number[] = [];
  const savings: number[] = [];
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (days - 1));
  // Accumulate anything before the window into the running totals.
  for (const t of s.transactions) {
    if (t.date < `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`) {
      if (t.amount > 0) cumIncome += t.amount;
      else cumExpense += Math.abs(t.amount);
    }
  }
  for (const label of labels) {
    const [mm, dd] = label.split('-').map(Number);
    const iso = `${end.getFullYear()}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    const bucket = byDay.get(iso);
    if (bucket) {
      cumIncome += bucket.income;
      cumExpense += bucket.expense;
    }
    cumNet = cumIncome - cumExpense;
    income.push(Math.round(cumIncome * 100) / 100);
    expense.push(Math.round(cumExpense * 100) / 100);
    net.push(Math.round(cumNet * 100) / 100);
    savings.push(cumIncome > 0 ? Math.round((cumNet / cumIncome) * 1000) / 10 : 0);
  }
  return { labels, income, expense, net, savings };
});

export const selectAllTransactions = createSelector(selectAppState, (s) => s.transactions);
export const selectChartMode = createSelector(selectAppState, (s) => s.chartMode);
export const selectFilters = createSelector(selectAppState, (s) => s.filters);
export const selectSelection = createSelector(selectAppState, (s) => s.selection);
export const selectSort = createSelector(selectAppState, (s) => s.sort);
export const selectToast = createSelector(selectAppState, (s) => s.toast);
export const selectDrawer = createSelector(selectAppState, (s) => ({ open: s.drawerOpen, tab: s.drawerTab }));
export const selectPaletteOpen = createSelector(selectAppState, (s) => s.paletteOpen);
export const selectImportOpen = createSelector(selectAppState, (s) => s.importOpen);
export const selectDialog = createSelector(selectAppState, (s) => s.dialog);
export const selectConfirm = createSelector(selectAppState, (s) => s.confirm);
export const selectDrill = createSelector(selectAppState, (s) => s.drillCategory);
export const selectFlash = createSelector(selectAppState, (s) => s.flash);
