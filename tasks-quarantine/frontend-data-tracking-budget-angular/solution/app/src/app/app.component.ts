import { Component, HostListener, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { animate, style, transition, trigger } from '@angular/animations';
import * as BudgetActions from './store/budget.actions';
import {
  selectBudgetsByCategory,
  selectCanRedo,
  selectCanUndo,
  selectCategories,
  selectDisplayName,
  selectFilteredExpensesSorted,
  selectPeriod,
  selectView,
} from './store/budget.selectors';
import { periodLabel } from './models/models';
import { downloadTextFile, generateCsvExport, generateJsonExport } from './export/export.component';
import { ExpenseDialogComponent, ExpenseDialogResult } from './expenses/expense-dialog.component';

declare global {
  interface Window {
    webmcp_session_info?: () => unknown;
    webmcp_list_tools?: () => unknown;
    webmcp_invoke_tool?: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
  }
}

const CONTRACT_VERSION = 'zto-webmcp-v1';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [
    trigger('drawer', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('220ms cubic-bezier(0.2,0.7,0.2,1)', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 })),
      ]),
    ]),
    trigger('backdrop', [
      transition(':enter', [style({ opacity: 0 }), animate('200ms ease-out', style({ opacity: 1 }))]),
      transition(':leave', [animate('160ms ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('viewFade', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(6px)' }), animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))]),
    ]),
  ],
})
export class AppComponent implements OnInit {
  title = 'Budget';
  view$;
  period$;
  displayName$;
  canUndo$;
  canRedo$;
  drawerOpen = false;
  showShortcuts = false;
  periodLabel = periodLabel;

  constructor(private store: Store, private dialog: MatDialog, private snackBar: MatSnackBar) {
    this.view$ = this.store.select(selectView);
    this.period$ = this.store.select(selectPeriod);
    this.displayName$ = this.store.select(selectDisplayName);
    this.canUndo$ = this.store.select(selectCanUndo);
    this.canRedo$ = this.store.select(selectCanRedo);
  }

  ngOnInit(): void {
    this.registerWebMcp();
  }

  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;
    if (event.key === 'Escape' && this.drawerOpen) {
      this.drawerOpen = false;
      return;
    }
    if (typing) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.undo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
      event.preventDefault();
      this.redo();
      return;
    }
    if (event.key.toLowerCase() === 'e' && !event.ctrlKey && !event.metaKey) {
      this.toggleExport();
      return;
    }
    if (event.key.toLowerCase() === 'a' && !event.ctrlKey && !event.metaKey) {
      this.openAddDialog();
      return;
    }
  }

  setView(view: 'dashboard' | 'expenses' | 'settings' | 'export'): void {
    if (view === 'export') {
      this.drawerOpen = true;
      return;
    }
    this.store.dispatch(BudgetActions.setView({ view }));
  }

  toggleExport(): void {
    this.drawerOpen = !this.drawerOpen;
  }

  closeDrawer(): void {
    this.drawerOpen = false;
  }

  openAddDialog(): void {
    const ref = this.dialog.open(ExpenseDialogComponent, { width: '360px', data: { mode: 'add' } });
    ref.afterClosed().subscribe((result: ExpenseDialogResult | undefined) => {
      if (!result) return;
      this.store.dispatch(
        BudgetActions.addExpense({
          value: result.value,
          datetime: result.datetime,
          categoryId: result.categoryId,
          counterparty: result.counterparty,
        })
      );
      this.snackBar.open('Expense added', undefined, { duration: 2000 });
    });
  }

  previousPeriod(): void {
    this.store.dispatch(BudgetActions.previousPeriod());
  }

  nextPeriod(): void {
    this.store.dispatch(BudgetActions.nextPeriod());
  }

  undo(): void {
    this.store.dispatch(BudgetActions.undo());
  }

  redo(): void {
    this.store.dispatch(BudgetActions.redo());
  }

  ripple(event: MouseEvent): void {
    const host = event.currentTarget as HTMLElement;
    const rect = host.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ink = document.createElement('span');
    ink.className = 'ripple-ink';
    ink.style.width = ink.style.height = `${size}px`;
    ink.style.left = `${event.clientX - rect.left - size / 2}px`;
    ink.style.top = `${event.clientY - rect.top - size / 2}px`;
    host.appendChild(ink);
    window.setTimeout(() => ink.remove(), 520);
  }

  private async postcondition(extra: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const view = await firstValueFrom(this.store.select(selectView));
    const period = await firstValueFrom(this.store.select(selectPeriod));
    const rows = await firstValueFrom(this.store.select(selectFilteredExpensesSorted));
    return { visiblePostcondition: { view, period, visibleExpenseCount: rows.length, ...extra } };
  }

  private registerWebMcp(): void {
    const tools = [
      {
        name: 'expense_create',
        description: 'Create a new expense (amount, date, category, counterparty). Same action as the Add Expense dialog.',
        inputSchema: {
          type: 'object',
          properties: {
            value: { type: 'number', description: 'Expense amount, e.g. 25.00' },
            datetime: { type: 'string', description: 'ISO date, e.g. 2020-03-05' },
            categoryId: { type: 'string', description: 'Category id: food, shopping, entertainment, transport, cloths' },
            counterparty: { type: 'string', description: 'Merchant / counterparty name' },
          },
          required: ['value', 'datetime', 'categoryId'],
          additionalProperties: false,
        },
      },
      {
        name: 'expense_select',
        description: 'Toggle selection of an expense row (same action as the row checkbox on Expenses).',
        inputSchema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
          additionalProperties: false,
        },
      },
      {
        name: 'expense_update',
        description: 'Update an existing expense by id.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            value: { type: 'number' },
            datetime: { type: 'string' },
            categoryId: { type: 'string' },
            counterparty: { type: 'string' },
          },
          required: ['id'],
          additionalProperties: false,
        },
      },
      {
        name: 'expense_delete',
        description: 'Delete an expense by id. Same action as the row delete (X) button on Expenses.',
        inputSchema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
          additionalProperties: false,
        },
      },
      {
        name: 'add_expense_form_validate',
        description: 'Validate add-expense form fields (amount, date, category) without submitting.',
        inputSchema: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            date: { type: 'string' },
            category: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
      {
        name: 'add_expense_form_submit',
        description: 'Submit the add-expense form (amount, date, category, counterparty). Rejects with validation errors on invalid input.',
        inputSchema: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            date: { type: 'string' },
            category: { type: 'string' },
            counterparty: { type: 'string' },
          },
          required: ['amount', 'date', 'category'],
          additionalProperties: false,
        },
      },
      {
        name: 'add_expense_form_cancel',
        description: 'Cancel the add-expense form without adding an expense.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      },
      {
        name: 'add_expense_form_reset',
        description: 'Reset the add-expense form fields to empty.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      },
      {
        name: 'browse_open',
        description: 'Navigate to a destination view: dashboard, expenses, settings, or export.',
        inputSchema: {
          type: 'object',
          properties: { destination: { type: 'string', enum: ['dashboard', 'expenses', 'settings', 'export'] } },
          required: ['destination'],
          additionalProperties: false,
        },
      },
      {
        name: 'artifact_export',
        description: 'Open the Export drawer and download the Budget report in the requested format. Same action as the Download button.',
        inputSchema: {
          type: 'object',
          properties: { format: { type: 'string', enum: ['csv', 'json'] } },
          required: ['format'],
          additionalProperties: false,
        },
      },
      {
        name: 'artifact_import',
        description: 'Open the Export drawer import mode. File bytes are not passed via WebMCP; use the visible file input or paste box to complete the import.',
        inputSchema: {
          type: 'object',
          properties: { mode: { type: 'string', enum: ['budget-json'] } },
          required: ['mode'],
          additionalProperties: false,
        },
      },
      {
        name: 'artifact_copy',
        description: 'Copy the Budget report JSON to the clipboard. Same action as the Copy JSON button.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      },
      {
        name: 'browse_apply_filter',
        description: 'Apply the reporting-period filter (month/year) that scopes expenses, category totals, and budget progress.',
        inputSchema: {
          type: 'object',
          properties: {
            month: { type: 'number', description: '1-12' },
            year: { type: 'number' },
          },
          required: ['month', 'year'],
          additionalProperties: false,
        },
      },
    ];

    window.webmcp_session_info = () => ({
      contract_version: CONTRACT_VERSION,
      app: 'budget-angular',
      modules: ['entity-collection-v1', 'form-workflow-v1', 'browse-query-v1', 'artifact-transfer-v1'],
      tools: tools.map((t) => t.name),
    });

    window.webmcp_list_tools = () => tools;

    window.webmcp_invoke_tool = async (name: string, args: Record<string, unknown> = {}) => {
      switch (name) {
        case 'expense_create': {
          this.store.dispatch(
            BudgetActions.addExpense({
              value: Number(args['value']),
              datetime: String(args['datetime']),
              categoryId: String(args['categoryId']),
              counterparty: String(args['counterparty'] ?? ''),
            })
          );
          return { ok: true, ...(await this.postcondition({ createdFor: args['datetime'] })) };
        }
        case 'expense_select': {
          const selected = await firstValueFrom(this.store.select((s: any) => s.budget.selectedExpenseIds as string[]));
          const id = String(args['id']);
          const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
          this.store.dispatch(BudgetActions.setSelection({ ids: next }));
          return { ok: true, selected: next, ...(await this.postcondition()) };
        }
        case 'expense_update': {
          const expenses = await firstValueFrom(this.store.select(selectFilteredExpensesSorted));
          const existing = expenses.find((e) => e.id === args['id']);
          if (!existing) {
            throw new Error(`No expense with id ${args['id']}`);
          }
          this.store.dispatch(
            BudgetActions.updateExpense({
              id: String(args['id']),
              value: args['value'] !== undefined ? Number(args['value']) : existing.value,
              datetime: args['datetime'] ? String(args['datetime']) : existing.datetime,
              categoryId: args['categoryId'] ? String(args['categoryId']) : existing.categoryId,
              counterparty: args['counterparty'] !== undefined ? String(args['counterparty']) : existing.counterparty,
            })
          );
          return { ok: true, ...(await this.postcondition()) };
        }
        case 'expense_delete': {
          this.store.dispatch(BudgetActions.deleteExpense({ id: String(args['id']) }));
          return { ok: true, ...(await this.postcondition()) };
        }
        case 'add_expense_form_validate': {
          const errors: string[] = [];
          if (args['amount'] === undefined || Number(args['amount']) <= 0) errors.push('amount must be > 0');
          if (!args['date']) errors.push('date is required');
          if (!args['category']) errors.push('category is required');
          const categories = await firstValueFrom(this.store.select(selectCategories));
          if (args['category'] && !categories.some((c) => c.id === args['category'])) {
            errors.push('unknown category');
          }
          return { valid: errors.length === 0, errors };
        }
        case 'add_expense_form_submit': {
          const amount = Number(args['amount']);
          if (!(amount > 0) || !args['date'] || !args['category']) {
            throw new Error('Invalid add-expense form submission');
          }
          this.store.dispatch(
            BudgetActions.addExpense({
              value: amount,
              datetime: String(args['date']),
              categoryId: String(args['category']),
              counterparty: String(args['counterparty'] ?? ''),
            })
          );
          return { ok: true, ...(await this.postcondition()) };
        }
        case 'add_expense_form_cancel':
        case 'add_expense_form_reset':
          return { ok: true };
        case 'browse_open': {
          const destination = String(args['destination']) as 'dashboard' | 'expenses' | 'settings' | 'export';
          if (destination === 'export') {
            this.drawerOpen = true;
          } else {
            this.store.dispatch(BudgetActions.setView({ view: destination }));
          }
          return { ok: true, ...(await this.postcondition({ view: destination })) };
        }
        case 'browse_apply_filter': {
          const month = Number(args['month']);
          const year = Number(args['year']);
          this.store.dispatch(BudgetActions.setPeriod({ period: { month, year } }));
          const summary = await firstValueFrom(this.store.select(selectBudgetsByCategory));
          return { ok: true, period: { month, year }, budgetsByCategory: summary };
        }
        case 'artifact_export': {
          const format = String(args['format']) as 'csv' | 'json';
          this.drawerOpen = true;
          if (format === 'csv') {
            const csv = await generateCsvExport(this.store, false);
            downloadTextFile(csv, 'expenses.csv', 'text/csv');
          } else {
            const json = await generateJsonExport(this.store);
            downloadTextFile(json, 'budget-document.json', 'application/json');
          }
          return { ok: true, format, ...(await this.postcondition()) };
        }
        case 'artifact_import': {
          const mode = String(args['mode'] ?? 'budget-json');
          this.drawerOpen = true;
          return { ok: true, mode, ...(await this.postcondition()) };
        }
        case 'artifact_copy': {
          const json = await generateJsonExport(this.store);
          await navigator.clipboard.writeText(json);
          return { ok: true };
        }
        default:
          throw new Error(`Unknown WebMCP tool: ${name}`);
      }
    };
  }
}
