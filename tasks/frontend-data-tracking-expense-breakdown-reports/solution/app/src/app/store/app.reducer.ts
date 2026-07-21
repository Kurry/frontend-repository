import { createReducer, on } from '@ngrx/store';
import type { AppState, Transaction } from '../core/model';
import * as A from './app.actions';

function clampDay(d: Date, planned: number): string {
  const day = Math.min(planned, d.getDate());
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(day)}`;
}

/**
 * Seed collection: spans all eight expense categories plus both income
 * sources, dated within the current and previous calendar month so the burn
 * rate panel and legends are populated on first load. Regenerated on every
 * fresh load — the store is in-memory only, so reload resets to this baseline.
 */
function buildSeed(): Transaction[] {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevDay = (d: number) => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${prev.getFullYear()}-${p(prev.getMonth() + 1)}-${p(d)}`;
  };
  let ts = Date.now() - 10_000;
  const next = () => ++ts;
  const rows: Array<Omit<Transaction, 'id' | '_ts'>> = [
    { date: prevDay(21), payee: 'Trail Gear Outlet', category: 'Shopping', account: 'Credit Card', amount: -74.5, status: 'reconciled' },
    { date: prevDay(26), payee: 'Studio Retainer', category: 'Freelance', account: 'Savings', amount: 325, status: 'cleared' },
    { date: clampDay(now, 1), payee: 'Meridian Payroll', category: 'Salary', account: 'Checking', amount: 4200, status: 'cleared' },
    { date: clampDay(now, 2), payee: 'Rowan Property Mgmt', category: 'Housing', account: 'Checking', amount: -1450, status: 'cleared' },
    { date: clampDay(now, 3), payee: 'Brightside Studio', category: 'Freelance', account: 'Savings', amount: 650, status: 'cleared' },
    { date: clampDay(now, 4), payee: 'Whole Harvest Market', category: 'Groceries', account: 'Credit Card', amount: -86.4, status: 'cleared' },
    { date: clampDay(now, 5), payee: 'Metro Transit Card', category: 'Transport', account: 'Cash', amount: -32.5, status: 'cleared' },
    { date: clampDay(now, 6), payee: 'Forno Trattoria', category: 'Restaurants', account: 'Credit Card', amount: -58.9, status: 'pending' },
    { date: clampDay(now, 8), payee: 'Northline Power', category: 'Utilities', account: 'Checking', amount: -121.35, status: 'cleared' },
    { date: clampDay(now, 9), payee: 'Cinema Two', category: 'Entertainment', account: 'Credit Card', amount: -45, status: 'cleared' },
    { date: clampDay(now, 10), payee: 'City Clinic', category: 'Healthcare', account: 'Checking', amount: -210, status: 'reconciled' },
    { date: clampDay(now, 12), payee: 'Bright & Co.', category: 'Shopping', account: 'Credit Card', amount: -189.99, status: 'cleared' },
    { date: clampDay(now, 14), payee: 'Corner Grocer', category: 'Groceries', account: 'Credit Card', amount: -63.15, status: 'cleared' },
    { date: clampDay(now, 15), payee: 'Daybreak Coffee', category: 'Restaurants', account: 'Cash', amount: -27.8, status: 'cleared' },
    { date: clampDay(now, 16), payee: 'Rideshare North', category: 'Transport', account: 'Credit Card', amount: -18, status: 'pending' },
  ];
  return rows.map((r, i) => ({ ...r, id: `seed-${i + 1}`, _ts: next() }));
}

export const initialState: AppState = {
  transactions: buildSeed(),
  chartMode: 'breakdown',
  ceiling: 4800,
  filters: { category: null, type: null, dateStart: null, dateEnd: null, payee: null },
  selection: [],
  sort: { key: 'date', dir: 'desc' },
  toast: null,
  drawerOpen: false,
  drawerTab: 'markdown',
  paletteOpen: false,
  importOpen: false,
  dialog: null,
  confirm: null,
  drillCategory: null,
  flash: null,
};

export const appReducer = createReducer(
  initialState,
  on(A.createTransaction, (state, { transaction }) => ({
    ...state,
    transactions: [transaction, ...state.transactions],
  })),
  on(A.updateTransaction, (state, { transaction }) => ({
    ...state,
    transactions: state.transactions.map((t) => (t.id === transaction.id ? transaction : t)),
  })),
  on(A.deleteTransactions, (state, { ids }) => ({
    ...state,
    transactions: state.transactions.filter((t) => !ids.includes(t.id)),
    selection: state.selection.filter((id) => !ids.includes(id)),
  })),
  on(A.bulkCategorize, (state, { ids, category }) => ({
    ...state,
    transactions: state.transactions.map((t) =>
      ids.includes(t.id) ? { ...t, category, _ts: Date.now() } : t,
    ),
  })),
  on(A.importTransactions, (state, { transactions, mode }) => ({
    ...state,
    transactions: mode === 'replace' ? [...transactions] : [...transactions, ...state.transactions],
    selection: [],
  })),
  on(A.toggleSelect, (state, { id }) => ({
    ...state,
    selection: state.selection.includes(id)
      ? state.selection.filter((s) => s !== id)
      : [...state.selection, id],
  })),
  on(A.setSelection, (state, { ids }) => ({ ...state, selection: [...ids] })),
  on(A.clearSelection, (state) => ({ ...state, selection: [] })),
  on(A.setChartMode, (state, { mode }) => ({ ...state, chartMode: mode })),
  on(A.setCeiling, (state, { ceiling }) => ({ ...state, ceiling })),
  on(A.applyFilter, (state, { key, value }) => ({
    ...state,
    filters: { ...state.filters, [key]: value },
  })),
  on(A.clearFilters, (state) => ({
    ...state,
    filters: { category: null, type: null, dateStart: null, dateEnd: null, payee: null },
  })),
  on(A.setSort, (state, { key, dir }) => ({ ...state, sort: { key, dir } })),
  on(A.showToast, (state, { message, nonce }) => ({ ...state, toast: { message, nonce } })),
  on(A.hideToast, (state) => ({ ...state, toast: null })),
  on(A.openDrawer, (state, { tab }) => ({ ...state, drawerOpen: true, drawerTab: tab })),
  on(A.closeDrawer, (state) => ({ ...state, drawerOpen: false })),
  on(A.openPalette, (state) => ({ ...state, paletteOpen: true })),
  on(A.closePalette, (state) => ({ ...state, paletteOpen: false })),
  on(A.openImport, (state) => ({ ...state, importOpen: true })),
  on(A.closeImport, (state) => ({ ...state, importOpen: false })),
  on(A.openDialog, (state, { mode, id, prefill }) => ({ ...state, dialog: { mode, id, prefill } })),
  on(A.closeDialog, (state) => ({ ...state, dialog: null })),
  on(A.openConfirm, (state, { kind, ids }) => ({ ...state, confirm: { kind, ids } })),
  on(A.closeConfirm, (state) => ({ ...state, confirm: null })),
  on(A.setDrill, (state, { category }) => ({ ...state, drillCategory: category })),
  on(A.flashCategory, (state, { category, nonce }) => ({ ...state, flash: { category, nonce } })),
);
