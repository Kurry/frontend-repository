import { Injectable } from '@angular/core';
import { AppState, Transaction } from '../store/app.state';

@Injectable({
  providedIn: 'root'
})
export class ArtifactService {
  constructor() {}

  generateJsonExport(transactions: Transaction[], filters: AppState['filters'], ceiling: number): string {
    const income = transactions.filter(t => t.income).reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => !t.income).reduce((sum, t) => sum + t.amount, 0);
    const categoryTotals = new Map<string, number>();
    transactions.filter(t => !t.income).forEach(t => categoryTotals.set(t.category, (categoryTotals.get(t.category) ?? 0) + t.amount));
    const today = new Date();
    const monthToDate = transactions.filter(t => {
      const date = new Date(t.date);
      return !t.income && date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
    }).reduce((sum, t) => sum + t.amount, 0);
    const projectedMonthEnd = today.getDate() ? monthToDate / today.getDate() * new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() : 0;
    return JSON.stringify({
      version: 1,
      reportTitle: 'Expense Breakdown',
      generatedAt: new Date().toISOString(),
      filters: { category: filters.category, type: filters.type, dateStart: null, dateEnd: null, payeeQuery: filters.payee ?? '' },
      totals: { income, expenses, net: income - expenses, savingsRate: income ? (income - expenses) / income * 100 : 0, count: transactions.length },
      burnRate: { ceiling, monthToDate, projectedMonthEnd, over: projectedMonthEnd > ceiling },
      categoryBreakdown: Array.from(categoryTotals, ([category, amount]) => ({ category, amount, share: expenses ? amount / expenses : 0 })),
      transactions: transactions.map(({ date, payee, category, account, amount, income, status }) => ({ date, payee, category, account, amount: income ? amount : -amount, status })),
    }, null, 2);
  }

  generateMarkdownExport(transactions: Transaction[]): string {
    let md = '# Expense Breakdown Report\n\n';
    md += '| Date | Payee | Category | Amount |\n';
    md += '|---|---|---|---|\n';
    transactions.forEach(t => {
      md += `| ${t.date} | ${t.payee} | ${t.category} | ${t.amount} |\n`;
    });
    return md;
  }

  parseCsvImport(csvData: string): { valid: Transaction[], invalid: any[] } {
    // Basic CSV parser
    const valid: Transaction[] = [];
    const invalid: any[] = [];
    const rows = csvData.split('\n').map(r => r.trim()).filter(r => r);
    rows.slice(1).forEach((row, i) => {
      const parts = row.split(',');
      if (parts.length >= 5) {
        const tx: Transaction = {
          id: Date.now().toString() + i,
          date: parts[0],
          payee: parts[1],
          category: parts[2],
          account: parts[3],
          amount: parseFloat(parts[4]),
          income: parseFloat(parts[4]) > 0 && parts[2] === 'Salary',
          status: 'cleared'
        };
        if (!isNaN(tx.amount)) {
          valid.push(tx);
        } else {
          invalid.push(row);
        }
      } else {
        invalid.push(row);
      }
    });
    return { valid, invalid };
  }
}
