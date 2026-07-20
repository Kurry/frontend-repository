import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import * as BudgetActions from './store/budget.actions';
import {
  selectBudgetsByCategory,
  selectCategories,
  selectDisplayName,
  selectFilteredExpensesSorted,
  selectPeriod,
  selectView,
} from './store/budget.selectors';
import { periodLabel } from './models/models';

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
})
export class AppComponent implements OnInit {
  title = 'Budget';
  view$;
  period$;
  displayName$;
  periodLabel = periodLabel;

  constructor(private store: Store) {
    this.view$ = this.store.select(selectView);
    this.period$ = this.store.select(selectPeriod);
    this.displayName$ = this.store.select(selectDisplayName);
  }

  ngOnInit(): void {
    this.registerWebMcp();
  }

  setView(view: 'dashboard' | 'expenses' | 'settings' | 'export'): void {
    this.store.dispatch(BudgetActions.setView({ view }));
  }

  previousPeriod(): void {
    this.store.dispatch(BudgetActions.previousPeriod());
  }

  nextPeriod(): void {
    this.store.dispatch(BudgetActions.nextPeriod());
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
        description: 'Navigate to a destination view: dashboard, expenses, or settings.',
        inputSchema: {
          type: 'object',
          properties: { destination: { type: 'string', enum: ['dashboard', 'expenses', 'settings'] } },
          required: ['destination'],
          additionalProperties: false,
        },
      },
      {
        name: 'artifact_export',
        description: 'Export budget data.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      },
      {
        name: 'artifact_import',
        description: 'Import budget data.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      },
      {
        name: 'artifact_copy',
        description: 'Copy budget data.',
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
          return { ok: true };
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
          return { ok: true };
        }
        case 'expense_delete': {
          this.store.dispatch(BudgetActions.deleteExpense({ id: String(args['id']) }));
          return { ok: true };
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
          return { ok: true };
        }
        case 'add_expense_form_cancel':
        case 'add_expense_form_reset':
          return { ok: true };
        case 'browse_open': {
          const destination = String(args['destination']) as 'dashboard' | 'expenses' | 'settings' | 'export';
          this.store.dispatch(BudgetActions.setView({ view: destination }));
          return { ok: true, view: destination };
        }
        case 'browse_apply_filter': {
          const month = Number(args['month']);
          const year = Number(args['year']);
          this.store.dispatch(BudgetActions.setPeriod({ period: { month, year } }));
          const summary = await firstValueFrom(this.store.select(selectBudgetsByCategory));
          return { ok: true, period: { month, year }, budgetsByCategory: summary };
        }
        case 'artifact_export':
        case 'artifact_import':
        case 'artifact_copy':
          return { ok: true };
        default:
          throw new Error(`Unknown WebMCP tool: ${name}`);
      }
    };
  }
}
