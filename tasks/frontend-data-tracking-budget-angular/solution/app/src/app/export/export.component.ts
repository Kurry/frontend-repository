import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { selectBudgetState, selectBudgetsByCategory } from '../store/budget.selectors';
import { BudgetDocumentSchema } from '../models/schemas';
import * as BudgetActions from '../store/budget.actions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Expense } from '../models/models';

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrl: './export.component.scss'
})
export class ExportComponent {

  csvDiagnostics: any[] = [];
  pendingCsvExpenses: Expense[] = [];

  constructor(private store: Store, private snackBar: MatSnackBar) {}

  async generateJsonExport() {
    const state = await firstValueFrom(this.store.select(selectBudgetState));
    const categoriesState = await firstValueFrom(this.store.select(selectBudgetsByCategory));

    const totals = categoriesState.reduce((acc, cat) => {
        acc.budget += cat.maxExpenses;
        acc.spent += cat.currentExpenses;
        acc.left += cat.left;
        return acc;
    }, { budget: 0, spent: 0, left: 0 });

    const categories = categoriesState.map(cat => ({
        id: cat.categoryId,
        name: cat.name,
        counterpartyPatterns: state.categories.find(c => c.id === cat.categoryId)?.counterpartyPatterns || [],
        limit: cat.maxExpenses,
        spent: cat.currentExpenses,
        variance: cat.variance,
        projected: cat.projectedOverage ? 1 : 0,
        overThreshold: cat.overThreshold
    }));

    const jsonDoc = {
      meta: {
        exportedAt: new Date().toISOString(),
        period: `${state.period.month}/${state.period.year}`,
        expenseCount: state.expenses.length
      },
      totals,
      displayName: state.displayName,
      activePeriod: state.period,
      settings: {
        thresholdPercent: state.thresholdPercent,
        accountName: state.displayName
      },
      categories,
      recurringRules: [],
      expenses: state.expenses
    };

    return JSON.stringify(jsonDoc, null, 2);
  }

  async downloadJson() {
    const json = await this.generateJsonExport();
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budget-document.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async copyJson() {
    const json = await this.generateJsonExport();
    navigator.clipboard.writeText(json);
    this.snackBar.open('Copied', undefined, { duration: 2000 });
  }

  async importJson(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        const res = BudgetDocumentSchema.safeParse(data);
        if (res.success) {
          const validData = res.data;
          const newState = {
            expenses: validData.expenses,
            categories: validData.categories.map(c => ({ id: c.id, name: c.name, counterpartyPatterns: c.counterpartyPatterns })),
            budgetDefinitions: validData.categories.map(c => ({ categoryId: c.id, maxExpenses: c.limit || 0 })),
            displayName: validData.displayName,
            thresholdPercent: validData.settings.thresholdPercent,
            period: validData.activePeriod
          };
          this.store.dispatch(BudgetActions.hydrateState({ state: newState }));
          this.snackBar.open('Imported successfully', undefined, { duration: 2000 });
        } else {
            const errorMsg = res.error.issues[0]?.message || 'Invalid JSON format';
            this.snackBar.open(`Import failed: ${errorMsg}`, undefined, { duration: 3000 });
        }
      } catch (err) {
        this.snackBar.open('Failed to parse JSON', undefined, { duration: 3000 });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  async generateCsvExport() {
    const state = await firstValueFrom(this.store.select(selectBudgetState));
    let csv = "date,counterparty,category,value\n";
    state.expenses.forEach(e => {
        csv += `${e.datetime},${e.counterparty || ''},${e.categoryId},${e.value}\n`;
    });
    return csv;
  }

  async downloadCsv() {
    const csv = await this.generateCsvExport();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async copyCsv() {
    const csv = await this.generateCsvExport();
    navigator.clipboard.writeText(csv);
    this.snackBar.open('Copied', undefined, { duration: 2000 });
  }

  async importCsv(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length < 1) {
            this.snackBar.open('CSV is empty', undefined, { duration: 3000 });
            return;
        }

        const state = await firstValueFrom(this.store.select(selectBudgetState));
        this.csvDiagnostics = [];
        this.pendingCsvExpenses = [];

        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',');
            if (parts.length < 4) {
                 this.csvDiagnostics.push({ row: i, valid: false, message: 'Missing columns' });
                 continue;
            }
            const [date, counterparty, category, valueStr] = parts;
            const value = Number(valueStr);

            let valid = true;
            let message = 'Valid';

            if (isNaN(value) || value <= 0) { valid = false; message = 'Invalid value'; }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { valid = false; message = 'date must be YYYY-MM-DD'; }
            if (!state.categories.find(c => c.id === category)) { valid = false; message = 'unknown category'; }

            this.csvDiagnostics.push({ row: i, date, counterparty, category, value, valid, message });

            if (valid) {
                const d = new Date(date);
                const period = { month: d.getMonth() + 1, year: d.getFullYear() };
                this.pendingCsvExpenses.push({
                   id: 'csv-' + i + '-' + Date.now(),
                   value,
                   datetime: date,
                   categoryId: category,
                   counterparty,
                   period
                });
            }
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  commitCsv() {
      this.pendingCsvExpenses.forEach(e => {
          this.store.dispatch(BudgetActions.addExpense({
              value: e.value,
              datetime: e.datetime,
              categoryId: e.categoryId,
              counterparty: e.counterparty
          }));
      });
      const imported = this.pendingCsvExpenses.length;
      const skipped = this.csvDiagnostics.length - imported;
      this.snackBar.open(`Imported ${imported}, skipped ${skipped}`, undefined, { duration: 3000 });
      this.csvDiagnostics = [];
      this.pendingCsvExpenses = [];
  }
}
