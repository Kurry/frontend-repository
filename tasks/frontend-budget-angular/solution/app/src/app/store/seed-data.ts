import { BudgetDefinition, Expense, ExpenseCategory, Period } from '../models/models';

export const SEED_CATEGORIES: ExpenseCategory[] = [
  { id: 'food', name: 'Food', counterpartyPatterns: ['mcdonalds', 'kfc', 'subway'] },
  { id: 'shopping', name: 'Shopping', counterpartyPatterns: ['wallmart', 'kaufland', 'auchan'] },
  { id: 'entertainment', name: 'Entertainment', counterpartyPatterns: ['rocky bowling', 'johnys pub', 'ricky bar'] },
  { id: 'transport', name: 'Transport', counterpartyPatterns: ['gas station', 'tube machine'] },
  { id: 'cloths', name: 'Cloths', counterpartyPatterns: ['tkmax', 'primark'] },
];

export const SEED_BUDGET_DEFINITIONS: BudgetDefinition[] = [
  { categoryId: 'food', maxExpenses: 2000 },
  { categoryId: 'shopping', maxExpenses: 500 },
  { categoryId: 'entertainment', maxExpenses: 1000 },
  { categoryId: 'transport', maxExpenses: 1200 },
  { categoryId: 'cloths', maxExpenses: 2000 },
];

export const SEED_PERIOD: Period = { month: 3, year: 2020 };

const marPeriod: Period = { month: 3, year: 2020 };
const febPeriod: Period = { month: 2, year: 2020 };

export const SEED_EXPENSES: Expense[] = [
  { id: 'e1', value: 235.42, datetime: '2020-03-01', categoryId: 'entertainment', counterparty: 'Rocky bowling', period: marPeriod },
  { id: 'e2', value: 173.68, datetime: '2020-03-03', categoryId: 'cloths', counterparty: 'Tkmax', period: marPeriod },
  { id: 'e3', value: 28.43, datetime: '2020-03-04', categoryId: 'cloths', counterparty: 'Tkmax', period: marPeriod },
  { id: 'e4', value: 218.69, datetime: '2020-03-13', categoryId: 'shopping', counterparty: 'Wallmart', period: marPeriod },
  { id: 'e5', value: 51.74, datetime: '2020-03-14', categoryId: 'shopping', counterparty: 'Wallmart', period: marPeriod },
  { id: 'e6', value: 257.15, datetime: '2020-03-15', categoryId: 'entertainment', counterparty: 'Rocky bowling', period: marPeriod },
  { id: 'e7', value: 263.60, datetime: '2020-03-17', categoryId: 'transport', counterparty: 'Gas station', period: marPeriod },
  { id: 'e8', value: 169.33, datetime: '2020-03-24', categoryId: 'food', counterparty: 'Mcdonalds', period: marPeriod },
  { id: 'e9', value: 266.33, datetime: '2020-03-25', categoryId: 'food', counterparty: 'Mcdonalds', period: marPeriod },
  { id: 'e10', value: 92.31, datetime: '2020-03-30', categoryId: 'shopping', counterparty: 'Wallmart', period: marPeriod },
  { id: 'e11', value: 45.20, datetime: '2020-02-05', categoryId: 'food', counterparty: 'Kfc', period: febPeriod },
  { id: 'e12', value: 120.00, datetime: '2020-02-10', categoryId: 'shopping', counterparty: 'Kaufland', period: febPeriod },
  { id: 'e13', value: 80.50, datetime: '2020-02-18', categoryId: 'entertainment', counterparty: 'Johnys pub', period: febPeriod },
  { id: 'e14', value: 60.00, datetime: '2020-02-22', categoryId: 'transport', counterparty: 'Tube machine', period: febPeriod },
  { id: 'e15', value: 99.99, datetime: '2020-02-27', categoryId: 'cloths', counterparty: 'Primark', period: febPeriod },
];
