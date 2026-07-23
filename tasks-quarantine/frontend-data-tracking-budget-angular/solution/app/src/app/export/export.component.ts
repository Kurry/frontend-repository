import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom, Subscription } from 'rxjs';
import { deriveRuleInstances, selectBudgetState, selectBudgetsByCategory } from '../store/budget.selectors';
import { BudgetDocumentSchema } from '../models/schemas';
import * as BudgetActions from '../store/budget.actions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Expense, Period, periodEquals } from '../models/models';
import { BudgetState } from '../store/budget.reducer';

/** Stored expenses for a period plus rule-derived instances (the full visible ledger). */
export function expensesForPeriod(state: BudgetState, period: Period): Expense[] {
  const stored = state.expenses.filter((e) => periodEquals(e.period, period));
  return [...stored, ...deriveRuleInstances(state, period)];
}

/**
 * Standalone generation helpers shared with app.component.ts's WebMCP
 * artifact-transfer handlers, so those tools call the same report-building
 * logic as the visible Export view instead of faking success.
 */
export async function generateJsonExport(store: Store): Promise<string> {
  const state = await firstValueFrom(store.select(selectBudgetState));
  const categoriesState = await firstValueFrom(store.select(selectBudgetsByCategory));
  // The exported expenses array carries the active period's full visible ledger
  // (stored + rule-derived) so totals/category-spent agree with the document;
  // other periods' expenses are stored only. On import these become real rows and
  // the selector skips re-deriving them (stored recurring match), avoiding dupes.
  const activePeriodExpenses = expensesForPeriod(state, state.period);
  const otherPeriodExpenses = state.expenses.filter((e) => !periodEquals(e.period, state.period));
  const exportedExpenses = [...otherPeriodExpenses, ...activePeriodExpenses];

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
      expenseCount: exportedExpenses.length
    },
    totals,
    displayName: state.displayName,
    activePeriod: state.period,
    settings: {
      thresholdPercent: state.thresholdPercent,
      accountName: state.displayName
    },
    categories,
    recurringRules: state.recurringRules.map(({ name, value, categoryId, dayOfMonth }) => ({ name, value, categoryId, dayOfMonth })),
    expenses: exportedExpenses.map(expense => ({ ...expense, recurring: Boolean(expense.recurring) }))
  };

  return JSON.stringify(jsonDoc, null, 2);
}

export async function generateCsvExport(store: Store, includeAllPeriods: boolean): Promise<string> {
  const state = await firstValueFrom(store.select(selectBudgetState));
  const categoryNames = new Map(state.categories.map(category => [category.id, category.name]));
  const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  let csv = "Date, Counterparty, Category, Value, Period\n";
  const periods: Period[] = includeAllPeriods
    ? Array.from(new Map([...state.expenses, ...deriveRuleInstances(state, state.period)]
        .map(e => [`${e.period.month}-${e.period.year}`, e.period] as [string, Period])).values())
        .sort((a, b) => a.year - b.year || a.month - b.month)
    : [state.period];
  periods.forEach(period => {
    expensesForPeriod(state, period).forEach(expense => {
      csv += [
        escapeCsv(expense.datetime),
        escapeCsv(expense.counterparty || ''),
        escapeCsv(categoryNames.get(expense.categoryId) || expense.categoryId),
        expense.value,
        escapeCsv(`${expense.period.month}/${expense.period.year}`)
      ].join(',') + '\n';
    });
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
  pasteJsonText = '';
  pasteCsvText = '';
  importStatus = '';
  jsonDiff: { currentCount: number; importedCount: number; currentCategories: number; importedCategories: number } | null = null;
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
    await navigator.clipboard.writeText(json);
    this.announce('Copied Budget report JSON to clipboard');
    this.snackBar.open('Copied', undefined, { duration: 2000 });
  }

  private announce(message: string): void {
    this.importStatus = message;
  }

  importJson(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.importJsonError = '';
    const reader = new FileReader();
    reader.onload = (e) => {
      this.applyJsonImport(e.target?.result as string);
    };
    reader.readAsText(file);
    input.value = '';
  }

  onPasteJsonChange(): void {
    this.jsonDiff = this.computeJsonDiff(this.pasteJsonText);
  }

  importPastedJson(): void {
    this.applyJsonImport(this.pasteJsonText);
  }

  private computeJsonDiff(text: string): { currentCount: number; importedCount: number; currentCategories: number; importedCategories: number } | null {
    try {
      const data = JSON.parse(text || '');
      if (!data || !Array.isArray((data as any).expenses)) return null;
      const state = this.store.select(selectBudgetState);
      let currentCount = 0;
      let currentCategories = 0;
      state.subscribe(s => { currentCount = s.expenses.length; currentCategories = s.categories.length; }).unsubscribe();
      return {
        currentCount,
        importedCount: (data as any).expenses.length,
        currentCategories,
        importedCategories: Array.isArray((data as any).categories) ? (data as any).categories.length : 0,
      };
    } catch {
      return null;
    }
  }

  private applyJsonImport(text: string): void {
    this.importJsonError = '';
    this.jsonDiff = null;
    if (!text || !text.trim()) {
      this.importJsonError = 'JSON file is empty';
      this.announce('Import failed: JSON file is empty');
      return;
    }
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      this.importJsonError = 'JSON: failed to parse malformed JSON';
      this.announce('Import failed: malformed JSON');
      return;
    }
    const res = BudgetDocumentSchema.safeParse(data);
    if (res.success) {
      const validData = res.data;
      const newState = {
        expenses: validData.expenses,
        categories: validData.categories.map(c => ({ id: c.id, name: c.name, counterpartyPatterns: c.counterpartyPatterns })),
        budgetDefinitions: validData.categories.map(c => ({ categoryId: c.id, maxExpenses: c.limit || 0 })),
        displayName: validData.displayName,
        thresholdPercent: validData.settings.thresholdPercent,
        recurringRules: validData.recurringRules.map(r => ({ key: 'r' + Math.floor(Math.random() * 1e9), name: r.name, value: r.value, categoryId: r.categoryId, dayOfMonth: r.dayOfMonth })),
        period: validData.activePeriod,
        filterCategoryId: null
      };
      this.store.dispatch(BudgetActions.hydrateState({ state: newState }));
      this.importJsonError = '';
      this.pasteJsonText = '';
      this.announce(`Imported Budget report JSON: ${validData.expenses.length} expenses restored`);
      this.snackBar.open('Imported successfully', undefined, { duration: 2000 });
    } else {
      const issue = res.error.issues[0];
      const field = issue?.path.length ? issue.path.join('.') : 'Budget report';
      this.importJsonError = `${field}: ${issue?.message || 'invalid JSON format'}`;
      this.announce(`Import rejected: ${field} ${issue?.message || 'invalid'}`);
    }
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
    await navigator.clipboard.writeText(csv);
    this.announce('Copied Transactions CSV to clipboard');
    this.snackBar.open('Copied', undefined, { duration: 2000 });
  }

  importPastedCsv(): void {
    this.importCsvText(this.pasteCsvText);
  }

  private importCsvText(text: string): void {
    this.csvDiagnostics = [];
    this.pendingCsvExpenses = [];
    if (!text || !text.trim()) {
      this.announce('CSV import: file is empty');
      this.snackBar.open('CSV is empty', undefined, { duration: 3000 });
      return;
    }
    try {
      const rows = parseCsv(text);
      if (rows.length < 1) {
        this.announce('CSV import: no rows found');
        this.snackBar.open('CSV is empty', undefined, { duration: 3000 });
        return;
      }
      this.buildCsvDiagnostics(rows);
      const valid = this.pendingCsvExpenses.length;
      this.announce(`CSV diagnostic ready: ${valid} valid of ${this.csvDiagnostics.length} rows`);
    } catch {
      this.csvDiagnostics = [];
      this.pendingCsvExpenses = [];
      this.announce('CSV import: failed to parse');
      this.snackBar.open('Failed to parse CSV', undefined, { duration: 3000 });
    }
  }

  importCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.importCsvText(e.target?.result as string);
    };
    reader.readAsText(file);
    input.value = '';
  }

  private buildCsvDiagnostics(rows: string[][]): void {
    let snapshot: { categories: { id: string; name: string }[] } = { categories: [] };
    this.store.select(selectBudgetState).subscribe(s => { snapshot = { categories: s.categories }; }).unsubscribe();
    this.csvCategoryByName = new Map(snapshot.categories.map(category => [category.name.trim().toLowerCase(), category.id]));
    this.csvCategoryIds = new Set(snapshot.categories.map(category => category.id));
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
      const message = `Imported ${imported}, skipped ${skipped}`;
      this.announce(message);
      this.snackBar.open(message, undefined, { duration: 3000 });
      this.csvDiagnostics = [];
      this.pendingCsvExpenses = [];
      this.pasteCsvText = '';
  }
}
