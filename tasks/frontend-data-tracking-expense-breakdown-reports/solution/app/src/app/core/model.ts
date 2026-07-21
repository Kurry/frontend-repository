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
] as const;

export const INCOME_CATEGORIES: readonly string[] = ['Salary', 'Freelance'];

export const EXPENSE_CATEGORIES: readonly string[] = CATEGORIES.filter(
  (c) => !INCOME_CATEGORIES.includes(c),
);

export const ACCOUNTS = ['Checking', 'Savings', 'Credit Card', 'Cash'] as const;

export const STATUSES = ['cleared', 'pending', 'reconciled'] as const;

export type TxStatus = (typeof STATUSES)[number];

export interface Transaction {
  id: string;
  /** ISO calendar date YYYY-MM-DD */
  date: string;
  payee: string;
  category: string;
  account: string;
  /** Signed: positive for income, negative for expenses. */
  amount: number;
  status?: TxStatus;
  /** Internal touch order used for "latest activity" legends; never exported. */
  _ts: number;
}

export interface Filters {
  category: string | null;
  type: 'income' | 'expense' | null;
  dateStart: string | null;
  dateEnd: string | null;
  payee: string | null;
}

export interface AppState {
  transactions: Transaction[];
  chartMode: 'breakdown' | 'trends';
  ceiling: number;
  filters: Filters;
  selection: string[];
  sort: { key: 'date' | 'amount'; dir: 'asc' | 'desc' };
  toast: { message: string; nonce: number } | null;
  drawerOpen: boolean;
  drawerTab: 'markdown' | 'json';
  paletteOpen: boolean;
  importOpen: boolean;
  dialog: { mode: 'create' | 'edit'; id: string | null; prefill: Record<string, string> | null } | null;
  confirm: { kind: 'single' | 'bulk'; ids: string[] } | null;
  drillCategory: string | null;
  flash: { category: string; nonce: number } | null;
}

let idCounter = 0;
export function genId(): string {
  idCounter += 1;
  return `tx-${Date.now().toString(36)}-${idCounter}`;
}

/** Category color scale shared by sankey, doughnut, legends, and chips. */
export const CATEGORY_COLORS: Record<string, string> = {
  Groceries: '#3E8E7E',
  Restaurants: '#E0874B',
  Transport: '#4E79C7',
  Housing: '#0F3D3E',
  Utilities: '#8B6CC1',
  Entertainment: '#D85D7E',
  Healthcare: '#2AA5A0',
  Shopping: '#C2A23E',
  Salary: '#7BC4B8',
  Freelance: '#A7D8CE',
};

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#5B7C76';
}
