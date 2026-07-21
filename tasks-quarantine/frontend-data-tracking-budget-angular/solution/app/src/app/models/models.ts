export interface Period {
  month: number; // 1-12
  year: number;
}

export function periodEquals(a: Period, b: Period): boolean {
  return a.month === b.month && a.year === b.year;
}

export function periodLabel(p: Period): string {
  return `${p.month}/${p.year}`;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  counterpartyPatterns: string[];
}

export interface BudgetDefinition {
  categoryId: string;
  maxExpenses: number;
}

export interface Expense {
  id: string;
  value: number;
  datetime: string; // ISO date
  categoryId: string;
  counterparty: string;
  period: Period;
  recurring?: boolean;
}

export interface RecurringRule {
  name: string;
  value: number;
  categoryId: string;
  dayOfMonth: number;
}

export interface View {
  name: 'dashboard' | 'expenses' | 'settings';
}
