import { signal, computed } from '@preact/signals';
import {
  EXPENSE_CATEGORIES,
  isIncomeCategory,
} from './schemas.js';

let _id = 0;
const nextId = () => `t${++_id}_${Math.random().toString(36).slice(2, 8)}`;

const SEED_TRANSACTIONS = [
  { date: '2026-03-02', label: 'Acme Corp Payroll', category: 'Salary', account: 'Checking', amount: 4200, status: 'reconciled', note: 'Bi-monthly salary deposit' },
  { date: '2026-03-03', label: 'GreenLeaf Grocers', category: 'Groceries', account: 'Checking', amount: -86.4, status: 'cleared', note: '' },
  { date: '2026-03-05', label: 'Ada Books', category: 'Shopping', account: 'Credit Card', amount: -25.5, status: 'cleared', note: 'Design reference titles' },
  { date: '2026-03-07', label: 'Evening Market', category: 'Groceries', account: 'Checking', amount: -145.2, status: 'cleared', note: 'Weekly shop' },
  { date: '2026-03-09', label: 'City Transit Pass', category: 'Transport', account: 'Cash', amount: -62, status: 'cleared', note: '' },
  { date: '2026-03-11', label: 'Brightside Consulting', category: 'Freelance', account: 'Savings', amount: 950, status: 'pending', note: 'Invoice 0421' },
  { date: '2026-03-13', label: 'Copper Kettle Diner', category: 'Restaurants', account: 'Credit Card', amount: -54.8, status: 'cleared', note: '' },
  { date: '2026-03-15', label: 'Maple Row Loft Rent', category: 'Housing', account: 'Checking', amount: -1500, status: 'cleared', note: 'Monthly rent' },
  { date: '2026-03-17', label: 'Nova Cinemas', category: 'Entertainment', account: 'Credit Card', amount: -32, status: 'cleared', note: '' },
  { date: '2026-03-19', label: 'City Power and Light', category: 'Utilities', account: 'Checking', amount: -85, status: 'pending', note: '' },
  { date: '2026-03-23', label: 'Harbor Family Clinic', category: 'Healthcare', account: 'Checking', amount: -120, status: 'cleared', note: 'Annual checkup copay' },
  { date: '2026-03-26', label: 'Fuel Stop 12', category: 'Transport', account: 'Credit Card', amount: -45, status: 'cleared', note: '' },
];

const SEED_THRESHOLDS = [
  { category: 'Groceries', ceiling: 400 },
  { category: 'Restaurants', ceiling: 250 },
  { category: 'Transport', ceiling: 200 },
  { category: 'Housing', ceiling: 1600 },
  { category: 'Entertainment', ceiling: 30 },
];

function seedWithIds(rows) {
  return rows.map((r) => ({ ...r, id: nextId() }));
}

// --- Base signals ---
export const transactions = signal(seedWithIds(SEED_TRANSACTIONS));
export const thresholds = signal(SEED_THRESHOLDS.map((t) => ({ ...t })));
export const filters = signal({ category: null, type: null, dateStart: null, dateEnd: null });
export const displayCurrency = signal('USD');
export const chartTabMode = signal('breakdown');
export const sort = signal({ key: null, dir: 'asc' }); // key: 'date' | 'amount' | null
export const search = signal('');

export const selection = signal([]); // transaction ids
export const undoStack = signal([]);
export const redoStack = signal([]);

// UI / overlay state
export const toast = signal(null); // { id, kind, text, phase }
export const dialog = signal({ open: false, mode: 'create', initial: null, showErrors: false });
export const exportDrawer = signal({ open: false, tab: 'json' });
export const importPanel = signal({ open: false, content: '', status: 'idle', error: null, summary: null });
export const shortcutLegend = signal(false);
export const mobileNav = signal(false);

export const FX_VISIBLE = { USD: 1, EUR: 0.92, GBP: 0.78 };

// --- Derived ---
export const filteredTransactions = computed(() => {
  let list = transactions.value;
  const f = filters.value;
  const q = search.value.trim().toLowerCase();
  if (f.category) list = list.filter((t) => t.category === f.category);
  if (f.type === 'income') list = list.filter((t) => t.amount > 0);
  else if (f.type === 'expense') list = list.filter((t) => t.amount < 0);
  if (f.dateStart) list = list.filter((t) => t.date >= f.dateStart);
  if (f.dateEnd) list = list.filter((t) => t.date <= f.dateEnd);
  if (q) list = list.filter((t) => t.label.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || (t.note || '').toLowerCase().includes(q));
  const s = sort.value;
  if (s.key) {
    const dir = s.dir === 'desc' ? -1 : 1;
    list = [...list].sort((a, b) => {
      if (s.key === 'date') return a.date < b.date ? -dir : a.date > b.date ? dir : 0;
      return (a.amount - b.amount) * dir;
    });
  }
  return list;
});

export const totals = computed(() => {
  const list = filteredTransactions.value;
  let income = 0;
  let expenses = 0;
  list.forEach((t) => {
    if (t.amount > 0) income += t.amount;
    else if (t.amount < 0) expenses += Math.abs(t.amount);
  });
  const net = income - expenses;
  return {
    income: round2(income),
    expenses: round2(expenses),
    net: round2(net),
    savingsRate: income > 0 ? round1((net / income) * 100) : 0,
    count: list.length,
  };
});

export const summaryStats = computed(() => {
  const list = filteredTransactions.value;
  const count = list.length;
  let largest = null;
  let sum = 0;
  let minDate = null;
  let maxDate = null;
  list.forEach((t) => {
    sum += t.amount;
    if (largest === null || Math.abs(t.amount) > Math.abs(largest.amount)) largest = t;
    if (minDate === null || t.date < minDate) minDate = t.date;
    if (maxDate === null || t.date > maxDate) maxDate = t.date;
  });
  return {
    count,
    largest,
    average: count > 0 ? round2(sum / count) : 0,
    dateStart: minDate,
    dateEnd: maxDate,
  };
});

export const computedThresholds = computed(() => {
  const scope = filteredTransactions.value;
  return thresholds.value.map((th) => {
    const spend = round2(
      scope.filter((t) => t.category === th.category && t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0),
    );
    const ratio = th.ceiling > 0 ? spend / th.ceiling : 0;
    let status = 'under';
    if (spend > th.ceiling + 1e-9) status = 'over';
    else if (spend >= th.ceiling * 0.8 - 1e-9) status = 'near';
    return { ...th, monthToDate: spend, status, ratio };
  });
});

function round2(n) {
  return Math.round((n + 0) * 100) / 100;
}
function round1(n) {
  return Math.round(n * 10) / 10;
}

// --- Undo / redo timeline ---
function snapshot() {
  return {
    transactions: JSON.parse(JSON.stringify(transactions.value)),
    thresholds: JSON.parse(JSON.stringify(thresholds.value)),
  };
}
function pushUndo() {
  undoStack.value = [...undoStack.value, snapshot()];
  redoStack.value = [];
}

export function commitTransaction(record, editId) {
  pushUndo();
  const norm = { ...record, amount: Number(record.amount), label: String(record.label).trim() };
  if (editId) {
    transactions.value = transactions.value.map((t) => (t.id === editId ? { ...t, ...norm, id: editId } : t));
  } else {
    transactions.value = [...transactions.value, { ...norm, id: nextId() }];
  }
  if (editId) selection.value = selection.value.filter((id) => id !== editId || transactions.value.some((t) => t.id === id));
}

export function deleteTransaction(id) {
  pushUndo();
  transactions.value = transactions.value.filter((t) => t.id !== id);
  selection.value = selection.value.filter((x) => x !== id);
}

export function bulkCategorize(ids, category) {
  const target = [...new Set(ids)].filter((id) => transactions.value.some((t) => t.id === id));
  if (target.length === 0) return false;
  pushUndo();
  const set = new Set(target);
  transactions.value = transactions.value.map((t) => (set.has(t.id) ? { ...t, category } : t));
  selection.value = [];
  return true;
}

export function bulkDelete(ids) {
  const target = [...new Set(ids)].filter((id) => transactions.value.some((t) => t.id === id));
  if (target.length === 0) return false;
  pushUndo();
  const set = new Set(target);
  transactions.value = transactions.value.filter((t) => !set.has(t.id));
  selection.value = selection.value.filter((x) => !set.has(x));
  return true;
}

export function commitThresholdCeiling(category, ceiling) {
  pushUndo();
  thresholds.value = thresholds.value.map((th) => (th.category === category ? { ...th, ceiling } : th));
}

export function importLedger(parsed) {
  // parsed: validated { transactions, thresholds, displayCurrency? }
  pushUndo();
  transactions.value = parsed.transactions.map((t) => ({ ...t, id: nextId() }));
  thresholds.value = parsed.thresholds.map((t) => ({ ...t }));
  selection.value = [];
  if (parsed.displayCurrency) displayCurrency.value = parsed.displayCurrency;
}

export function undo() {
  const stack = undoStack.value;
  if (stack.length === 0) return;
  const prev = stack[stack.length - 1];
  redoStack.value = [...redoStack.value, snapshot()];
  transactions.value = prev.transactions;
  thresholds.value = prev.thresholds;
  selection.value = selection.value.filter((id) => prev.transactions.some((t) => t.id === id));
  undoStack.value = stack.slice(0, -1);
}

export function redo() {
  const stack = redoStack.value;
  if (stack.length === 0) return;
  const next = stack[stack.length - 1];
  undoStack.value = [...undoStack.value, snapshot()];
  transactions.value = next.transactions;
  thresholds.value = next.thresholds;
  selection.value = selection.value.filter((id) => next.transactions.some((t) => t.id === id));
  redoStack.value = stack.slice(0, -1);
}

// --- Filters / sort / currency ---
export function setFilters(patch) {
  filters.value = { ...filters.value, ...patch };
}
export function clearFilters() {
  filters.value = { category: null, type: null, dateStart: null, dateEnd: null };
  search.value = '';
}
export function setSort(key) {
  const cur = sort.value;
  if (cur.key !== key) sort.value = { key, dir: 'asc' };
  else if (cur.dir === 'asc') sort.value = { key, dir: 'desc' };
  else sort.value = { key: null, dir: 'asc' };
}
export function setCurrency(currency) {
  displayCurrency.value = currency;
}
export function setChartTab(tab) {
  chartTabMode.value = tab;
}

// --- Selection ---
export function toggleSelect(id) {
  selection.value = selection.value.includes(id)
    ? selection.value.filter((x) => x !== id)
    : [...selection.value, id];
}
export function setSelectAll(ids, on) {
  if (on) selection.value = [...new Set([...selection.value, ...ids])];
  else selection.value = selection.value.filter((x) => !ids.includes(x));
}
export function clearSelection() {
  selection.value = [];
}

// --- Overlays ---
export function openCreate(initial = null, showErrors = false) {
  dialog.value = { open: true, mode: 'create', initial, showErrors };
}
export function openEdit(record, showErrors = false) {
  dialog.value = { open: true, mode: 'edit', initial: record, showErrors };
}
export function closeDialog() {
  dialog.value = { open: false, mode: 'create', initial: null, showErrors: false };
}
export function openExport(tab = 'json') {
  exportDrawer.value = { open: true, tab };
}
export function closeExport() {
  exportDrawer.value = { ...exportDrawer.value, open: false };
}
export function setExportTab(tab) {
  exportDrawer.value = { ...exportDrawer.value, tab };
}
export function openImport() {
  importPanel.value = { open: true, content: '', status: 'idle', error: null, summary: null };
}
export function closeImport() {
  importPanel.value = { ...importPanel.value, open: false };
}

// --- Toasts ---
let toastTimer = null;
let toastId = 0;
export function showToast(text, kind = 'info') {
  if (toastTimer) clearTimeout(toastTimer);
  const id = ++toastId;
  toast.value = { id, kind, text, phase: 'in' };
  toastTimer = setTimeout(() => dismissToast(id), 2600);
}
export function dismissToast(id) {
  const cur = toast.value;
  if (!cur || (id != null && cur.id !== id)) return;
  toast.value = { ...cur, phase: 'out' };
  setTimeout(() => {
    if (toast.value && toast.value.id === cur.id) toast.value = null;
  }, 260);
}

export function isExpenseCategory(c) {
  return EXPENSE_CATEGORIES.includes(c);
}
export { isIncomeCategory };
