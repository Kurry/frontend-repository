import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom, Subscription } from 'rxjs';
import { selectBudgetState, selectBudgetsByCategory } from '../store/budget.selectors';
import { BudgetDocumentSchema } from '../models/schemas';
import * as BudgetActions from '../store/budget.actions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Expense, periodEquals } from '../models/models';

/**
 * Standalone generation helpers shared with app.component.ts's WebMCP
 * artifact-transfer handlers, so those tools call the same report-building
 * logic as the visible Export view instead of faking success.
 */
export async function generateJsonExport(store: Store): Promise<string> {
  const state = await firstValueFrom(store.select(selectBudgetState));
  const categoriesState = await firstValueFrom(store.select(selectBudgetsByCategory));

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
      maxExpenses: cat.maxExpenses,
      limit: cat.maxExpenses,
      spent: cat.currentExpenses,
      variance: cat.variance,
      projected: cat.projected,
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
    recurringRules: state.recurringRules,
    expenses: state.expenses.map(expense => ({ ...expense, recurring: Boolean(expense.recurring) }))
  };

  return JSON.stringify(jsonDoc, null, 2);
}

export async function generateCsvExport(store: Store, includeAllPeriods: boolean): Promise<string> {
  const state = await firstValueFrom(store.select(selectBudgetState));
  const categoryNames = new Map(state.categories.map(category => [category.id, category.name]));
  const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  let csv = "Date, Counterparty, Category, Value, Period\n";
  state.expenses
    .filter(expense => includeAllPeriods || periodEquals(expense.period, state.period))
    .forEach(expense => {
      csv += [
        escapeCsv(expense.datetime),
        escapeCsv(expense.counterparty || ''),
        escapeCsv(categoryNames.get(expense.categoryId) || expense.categoryId),
        expense.value,
        escapeCsv(`${expense.period.month}/${expense.period.year}`)
      ].join(',') + '\n';
    });
  return csv;
}

export function downloadTextFile(text: string, filename: string, mimeType: string): void {
  const blob = new Blob([text], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field);
      if (row.some(value => value.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else if (character !== '\r') {
      field += character;
    }
  }

  if (quoted) throw new Error('Unclosed quoted field');
  row.push(field);
  if (row.some(value => value.trim() !== '')) rows.push(row);
  return rows;
}

interface CsvDiagnostic {
  row: number;
  expenseId: string;
  included: boolean;
  date: string;
  counterparty: string;
  category: string;
  value: string;
  categoryId?: string;
  valid: boolean;
  message: string;
}

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrl: './export.component.scss'
})
export class ExportComponent implements OnInit, OnDestroy {

  csvDiagnostics: CsvDiagnostic[] = [];
  pendingCsvExpenses: Expense[] = [];
  importJsonError = '';
  includeAllPeriods = false;
  jsonPreview = '';
  csvPreview = '';
  private previewSubscription?: Subscription;
  private previewGeneration = 0;
  private csvCategoryByName = new Map<string, string>();
  private csvCategoryIds = new Set<string>();

  constructor(private store: Store, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.previewSubscription = this.store.select(selectBudgetState).subscribe(() => {
      void this.refreshPreviews();
    });
  }

  ngOnDestroy() {
    this.previewSubscription?.unsubscribe();
    this.previewGeneration++;
  }

  async refreshPreviews() {
    const generation = ++this.previewGeneration;
    const [json, csv] = await Promise.all([this.generateJsonExport(), this.generateCsvExport()]);
    if (generation !== this.previewGeneration) return;
    this.jsonPreview = json;
    this.csvPreview = csv;
  }

  async generateJsonExport() {
    return generateJsonExport(this.store);
  }

  async downloadJson() {
    const json = this.jsonPreview || await this.generateJsonExport();
    downloadTextFile(json, 'budget-document.json', 'application/json');
  }

  async copyJson() {
    const json = this.jsonPreview || await this.generateJsonExport();
    navigator.clipboard.writeText(json);
    this.snackBar.open('Copied', undefined, { duration: 2000 });
  }

  async importJson(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.importJsonError = '';
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
            recurringRules: validData.recurringRules,
            period: validData.activePeriod,
            filterCategoryId: null
          };
          this.store.dispatch(BudgetActions.hydrateState({ state: newState }));
          this.importJsonError = '';
          this.snackBar.open('Imported successfully', undefined, { duration: 2000 });
        } else {
            const issue = res.error.issues[0];
            const field = issue?.path.length ? issue.path.join('.') : 'Budget report';
            this.importJsonError = `${field}: ${issue?.message || 'invalid JSON format'}`;
        }
      } catch (err) {
        this.importJsonError = 'JSON: failed to parse malformed JSON';
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  async generateCsvExport() {
    return generateCsvExport(this.store, this.includeAllPeriods);
  }

  setCsvScope(event: Event) {
    this.includeAllPeriods = (event.target as HTMLInputElement).checked;
    void this.refreshPreviews();
  }

  async downloadCsv() {
    const csv = this.csvPreview || await this.generateCsvExport();
    downloadTextFile(csv, 'expenses.csv', 'text/csv');
  }

  async copyCsv() {
    const csv = this.csvPreview || await this.generateCsvExport();
    navigator.clipboard.writeText(csv);
    this.snackBar.open('Copied', undefined, { duration: 2000 });
  }

  async importCsv(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCsv(text);
        if (rows.length < 1) {
            this.snackBar.open('CSV is empty', undefined, { duration: 3000 });
            return;
        }

        const state = await firstValueFrom(this.store.select(selectBudgetState));
        this.csvCategoryByName = new Map(state.categories.map(category => [category.name.trim().toLowerCase(), category.id]));
        this.csvCategoryIds = new Set(state.categories.map(category => category.id));
        this.csvDiagnostics = [];
        this.pendingCsvExpenses = [];

        for (let i = 1; i < rows.length; i++) {
            const parts = rows[i];
            const diagnostic: CsvDiagnostic = {
              row: i,
              expenseId: `csv-${i}-${Date.now()}`,
              included: true,
              date: parts[0]?.trim() || '',
              counterparty: parts[1]?.trim() || '',
              category: parts[2]?.trim() || '',
              value: parts[3]?.trim() || '',
              valid: false,
              message: ''
            };
            this.validateCsvDiagnostic(diagnostic);
            this.csvDiagnostics.push(diagnostic);
        }
        this.rebuildPendingCsvExpenses();
      } catch (err) {
        this.csvDiagnostics = [];
        this.pendingCsvExpenses = [];
        this.snackBar.open('Failed to parse CSV', undefined, { duration: 3000 });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  revalidateCsvRow(diagnostic: CsvDiagnostic) {
    this.validateCsvDiagnostic(diagnostic);
    this.rebuildPendingCsvExpenses();
  }

  private validateCsvDiagnostic(diagnostic: CsvDiagnostic) {
    const date = diagnostic.date.trim();
    const counterparty = diagnostic.counterparty.trim();
    const category = diagnostic.category.trim();
    const value = Number(diagnostic.value);
    const categoryId = this.csvCategoryByName.get(category.toLowerCase())
      || (this.csvCategoryIds.has(category) ? category : undefined);
    const errors: string[] = [];

    if (!Number.isFinite(value) || value <= 0) errors.push('Invalid value');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('date must be YYYY-MM-DD');
    if (!counterparty) errors.push('counterparty is required');
    if (!categoryId) errors.push('unknown category');

    diagnostic.categoryId = categoryId;
    diagnostic.valid = errors.length === 0;
    diagnostic.message = diagnostic.valid ? 'Valid' : errors.join('; ');
  }

  private rebuildPendingCsvExpenses() {
    this.pendingCsvExpenses = this.csvDiagnostics
      .filter(diagnostic => diagnostic.included && diagnostic.valid && diagnostic.categoryId)
      .map(diagnostic => {
        const date = diagnostic.date.trim();
        const [year, month] = date.split('-').map(Number);
        return {
          id: diagnostic.expenseId,
          value: Number(diagnostic.value),
          datetime: date,
          categoryId: diagnostic.categoryId!,
          counterparty: diagnostic.counterparty.trim(),
          period: { month, year }
        };
      });
  }

  commitCsv() {
      this.csvDiagnostics.forEach(diagnostic => this.validateCsvDiagnostic(diagnostic));
      this.rebuildPendingCsvExpenses();
      const imported = this.pendingCsvExpenses.length;
      const skipped = this.csvDiagnostics.length - imported;
      if (imported > 0) {
        this.store.dispatch(BudgetActions.importExpenses({ expenses: this.pendingCsvExpenses }));
      }
      this.snackBar.open(`Imported ${imported}, skipped ${skipped}`, undefined, { duration: 3000 });
      this.csvDiagnostics = [];
      this.pendingCsvExpenses = [];
  }
}
