import { Injectable, NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import type { AppState, Transaction } from '../core/model';
import { applyRowFix, rowsToTransactions, validateTransaction, toTransaction } from '../core/contract';
import type { FieldError, FieldKey, ImportRow, RawTx } from '../core/contract';
import { buildJsonReport, buildMarkdownReport } from '../core/report';
import * as A from '../store/app.actions';
import { selectAllTransactions, selectBurnRate, selectFilteredTransactions, selectFilters } from '../store/app.selectors';

const CONTRACT_VERSION = 'zto-webmcp-v1';

const DESTINATIONS = [
  'breakdown-overview',
  'expense-list',
  'category-filter',
  'export-drawer',
  'burn-rate',
  'import-diagnostic',
  'command-palette',
] as const;

interface ToolDef {
  name: string;
  module: string;
  operation: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * WebMCP surface (zto-webmcp-v1). Every handler drives the exact same NgRx
 * actions and validation pipeline as the visible UI, inside the Angular zone
 * so postconditions render immediately.
 */
@Injectable({ providedIn: 'root' })
export class WebmcpService {
  private registered = false;

  constructor(
    private store: Store<{ app: AppState }>,
    private zone: NgZone,
  ) {}

  register(): void {
    if (this.registered) return;
    this.registered = true;

    const tools: ToolDef[] = [
      {
        name: 'browse_open',
        module: 'browse-query-v1',
        operation: 'open',
        description:
          'Open a declared destination: breakdown-overview, expense-list, category-filter, export-drawer, burn-rate, import-diagnostic, or command-palette. Uses the same handlers as the visible controls.',
        inputSchema: {
          type: 'object',
          properties: { destination: { type: 'string', enum: [...DESTINATIONS] } },
          required: ['destination'],
          additionalProperties: false,
        },
      },
      {
        name: 'browse_search',
        module: 'browse-query-v1',
        operation: 'search',
        description: 'Run the instant payee search (same handler as typing in the search field).',
        inputSchema: {
          type: 'object',
          properties: { query: { type: 'string', maxLength: 80 } },
          required: ['query'],
          additionalProperties: false,
        },
      },
      {
        name: 'browse_apply_filter',
        module: 'browse-query-v1',
        operation: 'apply_filter',
        description:
          'Apply one declared filter: category (ledger category or null), type (income|expense|null), date-range ({start,end} ISO dates or null), or payee (substring or null).',
        inputSchema: {
          type: 'object',
          properties: {
            filter: { type: 'string', enum: ['category', 'type', 'date-range', 'payee'] },
            value: {},
          },
          required: ['filter'],
          additionalProperties: false,
        },
      },
      {
        name: 'browse_clear_filter',
        module: 'browse-query-v1',
        operation: 'clear_filter',
        description: 'Clear one declared filter, or every filter when filter is "all" or omitted.',
        inputSchema: {
          type: 'object',
          properties: {
            filter: { type: 'string', enum: ['category', 'type', 'date-range', 'payee', 'all'] },
          },
          additionalProperties: false,
        },
      },
      {
        name: 'browse_sort',
        module: 'browse-query-v1',
        operation: 'sort',
        description: 'Sort the transactions table by amount or date (same handler as the table headers).',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', enum: ['amount', 'date'] },
            direction: { type: 'string', enum: ['asc', 'desc'] },
          },
          required: ['key', 'direction'],
          additionalProperties: false,
        },
      },
      {
        name: 'entity_create_expense',
        module: 'entity-collection-v1',
        operation: 'create',
        description:
          'Create an expense/income record via the same validation and store action as the New transaction dialog. Invalid input opens the dialog with the same inline per-field errors the form shows.',
        inputSchema: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'ISO calendar date YYYY-MM-DD' },
            label: { type: 'string', description: 'Payee, 1-80 characters' },
            category: {
              type: 'string',
              enum: ['Groceries', 'Restaurants', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Salary', 'Freelance'],
            },
            account: { type: 'string', enum: ['Checking', 'Savings', 'Credit Card', 'Cash'] },
            amount: { type: 'number', description: 'Signed: negative for expenses, positive for Salary/Freelance' },
            status: { type: 'string', enum: ['cleared', 'pending', 'reconciled'] },
          },
          required: ['date', 'label', 'category', 'account', 'amount'],
          additionalProperties: false,
        },
      },
      {
        name: 'entity_select_expense',
        module: 'entity-collection-v1',
        operation: 'select',
        description: 'Toggle a transaction row in the shared selection (same handler as the row checkbox).',
        inputSchema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
          additionalProperties: false,
        },
      },
      {
        name: 'entity_update_expense',
        module: 'entity-collection-v1',
        operation: 'update',
        description:
          'Update fields on an existing record via the same validation and store action as the Edit dialog. Invalid input opens the Edit dialog with the same inline per-field errors.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            date: { type: 'string' },
            label: { type: 'string' },
            category: { type: 'string' },
            account: { type: 'string' },
            amount: { type: 'number' },
            status: { type: 'string', enum: ['cleared', 'pending', 'reconciled'] },
          },
          required: ['id'],
          additionalProperties: false,
        },
      },
      {
        name: 'entity_delete_expense',
        module: 'entity-collection-v1',
        operation: 'delete',
        description: 'Delete a record through the same store action as the confirm dialog. Requires confirm=true.',
        inputSchema: {
          type: 'object',
          properties: { id: { type: 'string' }, confirm: { type: 'boolean' } },
          required: ['id', 'confirm'],
          additionalProperties: false,
        },
      },
      {
        name: 'artifact_export',
        module: 'artifact-transfer-v1',
        operation: 'export',
        description:
          'Open the Export report drawer on the json or markdown tab, compiled live from the shared store (same preview state the Export report control shows). No artifact bytes are returned.',
        inputSchema: {
          type: 'object',
          properties: { format: { type: 'string', enum: ['json', 'markdown'] } },
          required: ['format'],
          additionalProperties: false,
        },
      },
      {
        name: 'artifact_import',
        module: 'artifact-transfer-v1',
        operation: 'import',
        description:
          'Commit structured transactions-csv rows through the same validation pipeline as the Import CSV panel. Rows are field objects, never raw file bytes. write=replace mirrors "Replace all", write=append mirrors "Append".',
        inputSchema: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['transactions-csv'] },
            write: { type: 'string', enum: ['replace', 'append'] },
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  label: { type: 'string' },
                  category: { type: 'string' },
                  account: { type: 'string' },
                  amount: { type: 'number' },
                  status: { type: 'string' },
                },
                required: ['date', 'label', 'category', 'account', 'amount'],
              },
            },
          },
          required: ['mode', 'write', 'rows'],
          additionalProperties: false,
        },
      },
      {
        name: 'artifact_copy',
        module: 'artifact-transfer-v1',
        operation: 'copy',
        description:
          'Copy the json or markdown report to the clipboard via the same handler as the drawer Copy button and show the Copied confirmation. Clipboard contents are never returned here.',
        inputSchema: {
          type: 'object',
          properties: { format: { type: 'string', enum: ['json', 'markdown'] } },
          required: ['format'],
          additionalProperties: false,
        },
      },
    ];

    const win = window as unknown as Record<string, unknown>;
    win['webmcp_session_info'] = () => ({
      contract_version: CONTRACT_VERSION,
      app: 'expense-breakdown-reports',
      modules: [
        { id: 'browse-query-v1', contract_version: CONTRACT_VERSION, tool_name_prefix: 'browse' },
        { id: 'entity-collection-v1', contract_version: CONTRACT_VERSION, tool_name_prefix: 'entity' },
        { id: 'artifact-transfer-v1', contract_version: CONTRACT_VERSION, tool_name_prefix: 'artifact' },
      ],
      tools: tools.map((t) => t.name),
    });
    win['webmcp_list_tools'] = () =>
      tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
    win['webmcp_invoke_tool'] = async (name: string, args: Record<string, unknown> = {}) =>
      this.zone.run(() => this.invoke(name, args ?? {}));
  }

  private nonce(): number {
    return Date.now();
  }

  private toast(message: string): void {
    this.store.dispatch(A.showToast({ message, nonce: this.nonce() }));
  }

  private async invoke(name: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
    const str = (k: string): string | undefined =>
      args[k] === undefined || args[k] === null ? undefined : String(args[k]);
    const num = (k: string): number | undefined => {
      const v = args[k];
      if (v === undefined || v === null || v === '') return undefined;
      const n = typeof v === 'number' ? v : Number(String(v).replace(/[$,]/g, ''));
      return Number.isNaN(n) ? undefined : n;
    };

    switch (name) {
      case 'browse_open': {
        const destination = str('destination') ?? '';
        if (!(DESTINATIONS as readonly string[]).includes(destination)) {
          return { ok: false, error: `Unknown destination "${destination}"` };
        }
        switch (destination) {
          case 'breakdown-overview':
            this.store.dispatch(A.setChartMode({ mode: 'breakdown' }));
            document.getElementById('chart-panel')?.scrollIntoView({ block: 'nearest' });
            break;
          case 'expense-list':
            document.getElementById('transactions-panel')?.scrollIntoView({ block: 'nearest' });
            break;
          case 'category-filter': {
            document.getElementById('transactions-panel')?.scrollIntoView({ block: 'nearest' });
            const btn = document.getElementById('category-filter-btn');
            (btn as HTMLElement | null)?.focus();
            (btn as HTMLElement | null)?.click();
            break;
          }
          case 'export-drawer':
            this.store.dispatch(A.openDrawer({ tab: 'markdown' }));
            break;
          case 'burn-rate': {
            document.getElementById('burn-rate-panel')?.scrollIntoView({ block: 'nearest' });
            const input = document.getElementById('ceiling-input');
            (input as HTMLElement | null)?.focus();
            break;
          }
          case 'import-diagnostic':
            this.store.dispatch(A.openImport());
            break;
          case 'command-palette':
            this.store.dispatch(A.openPalette());
            break;
        }
        return { ok: true, destination };
      }

      case 'browse_search': {
        const query = str('query') ?? '';
        this.store.dispatch(A.applyFilter({ key: 'payee', value: query || null }));
        return { ok: true, matchCount: await this.filteredCount() };
      }

      case 'browse_apply_filter': {
        const filter = str('filter') ?? '';
        if (filter === 'category') {
          this.store.dispatch(A.applyFilter({ key: 'category', value: str('value') ?? null }));
        } else if (filter === 'type') {
          const v = str('value');
          this.store.dispatch(A.applyFilter({ key: 'type', value: v === 'income' || v === 'expense' ? v : null }));
        } else if (filter === 'date-range') {
          const value = (args['value'] ?? {}) as Record<string, unknown>;
          const start = value['start'] === undefined || value['start'] === null ? null : String(value['start']);
          const end = value['end'] === undefined || value['end'] === null ? null : String(value['end']);
          if (start && end && start > end) {
            return { ok: false, error: 'End date must be on or after start date' };
          }
          this.store.dispatch(A.applyFilter({ key: 'dateStart', value: start }));
          this.store.dispatch(A.applyFilter({ key: 'dateEnd', value: end }));
        } else if (filter === 'payee') {
          this.store.dispatch(A.applyFilter({ key: 'payee', value: str('value') ?? null }));
        } else {
          return { ok: false, error: `Unknown filter "${filter}"` };
        }
        return { ok: true, filter, matchCount: await this.filteredCount() };
      }

      case 'browse_clear_filter': {
        const filter = str('filter') ?? 'all';
        if (filter === 'all') {
          this.store.dispatch(A.clearFilters());
        } else if (filter === 'date-range') {
          this.store.dispatch(A.applyFilter({ key: 'dateStart', value: null }));
          this.store.dispatch(A.applyFilter({ key: 'dateEnd', value: null }));
        } else if (['category', 'type', 'payee'].includes(filter)) {
          this.store.dispatch(A.applyFilter({ key: filter as 'category' | 'type' | 'payee', value: null }));
        } else {
          return { ok: false, error: `Unknown filter "${filter}"` };
        }
        return { ok: true, matchCount: await this.filteredCount() };
      }

      case 'browse_sort': {
        const key = str('key');
        const dir = str('direction');
        if (key !== 'amount' && key !== 'date') return { ok: false, error: 'key must be amount or date' };
        if (dir !== 'asc' && dir !== 'desc') return { ok: false, error: 'direction must be asc or desc' };
        this.store.dispatch(A.setSort({ key, dir }));
        return { ok: true, key, direction: dir };
      }

      case 'entity_create_expense': {
        const raw: RawTx = {
          date: str('date') ?? '',
          payee: str('label') ?? '',
          category: str('category') ?? '',
          account: str('account') ?? '',
          amount: num('amount') ?? null,
          status: str('status') ?? '',
        };
        const errors = validateTransaction(raw);
        if (errors.length > 0) {
          // Same visible path as the UI: open the dialog prefilled with the
          // attempted values so the identical inline per-field errors show.
          this.store.dispatch(
            A.openDialog({
              mode: 'create',
              id: null,
              prefill: {
                date: raw.date,
                payee: raw.payee,
                category: raw.category,
                account: raw.account,
                amount: raw.amount === null ? '' : String(raw.amount),
                status: typeof raw.status === 'string' ? raw.status : '',
              },
            }),
          );
          return { ok: false, errors: errors.map((e) => ({ field: e.field, message: e.message })) };
        }
        const tx = toTransaction(raw);
        this.store.dispatch(A.createTransaction({ transaction: tx }));
        this.store.dispatch(A.flashCategory({ category: tx.category, nonce: this.nonce() }));
        this.toast(`Transaction created for ${tx.payee}`);
        return { ok: true, id: tx.id, count: await this.totalCount() };
      }

      case 'entity_select_expense': {
        const id = str('id');
        if (!id) return { ok: false, error: 'id is required' };
        const all = await firstValueFrom(this.store.select(selectAllTransactions));
        if (!all.some((t) => t.id === id)) return { ok: false, error: `No expense with id ${id}` };
        this.store.dispatch(A.toggleSelect({ id }));
        return { ok: true, id };
      }

      case 'entity_update_expense': {
        const id = str('id');
        if (!id) return { ok: false, error: 'id is required' };
        const all = await firstValueFrom(this.store.select(selectAllTransactions));
        const existing = all.find((t) => t.id === id);
        if (!existing) return { ok: false, error: `No expense with id ${id}` };
        const raw: RawTx = {
          date: str('date') ?? existing.date,
          payee: str('label') ?? existing.payee,
          category: str('category') ?? existing.category,
          account: str('account') ?? existing.account,
          amount: num('amount') ?? existing.amount,
          status: args['status'] !== undefined ? str('status') ?? '' : existing.status ?? '',
        };
        const errors = validateTransaction(raw);
        if (errors.length > 0) {
          this.store.dispatch(
            A.openDialog({
              mode: 'edit',
              id,
              prefill: {
                date: raw.date,
                payee: raw.payee,
                category: raw.category,
                account: raw.account,
                amount: raw.amount === null ? '' : String(raw.amount),
                status: typeof raw.status === 'string' ? raw.status : '',
              },
            }),
          );
          return { ok: false, errors: errors.map((e) => ({ field: e.field, message: e.message })) };
        }
        const tx = { ...toTransaction(raw, existing) };
        this.store.dispatch(A.updateTransaction({ transaction: tx }));
        this.store.dispatch(A.flashCategory({ category: tx.category, nonce: this.nonce() }));
        this.toast(`Transaction updated for ${tx.payee}`);
        return { ok: true, id, count: await this.totalCount() };
      }

      case 'entity_delete_expense': {
        const id = str('id');
        if (!id) return { ok: false, error: 'id is required' };
        if (args['confirm'] !== true) {
          return { ok: false, error: 'confirm=true is required to delete' };
        }
        const all = await firstValueFrom(this.store.select(selectAllTransactions));
        if (!all.some((t) => t.id === id)) return { ok: false, error: `No expense with id ${id}` };
        this.store.dispatch(A.deleteTransactions({ ids: [id] }));
        this.toast('Transaction deleted');
        return { ok: true, id, count: await this.totalCount() };
      }

      case 'artifact_export': {
        const format = str('format') === 'json' ? 'json' : 'markdown';
        this.store.dispatch(A.openDrawer({ tab: format }));
        const totals = await this.filteredCount();
        return { ok: true, format, drawerOpen: true, transactionsCount: totals };
      }

      case 'artifact_import': {
        const mode = str('mode');
        const write = str('write') === 'append' ? 'append' : 'replace';
        if (mode !== 'transactions-csv') {
          return { ok: false, error: 'Only import mode transactions-csv is declared' };
        }
        const rows = Array.isArray(args['rows']) ? (args['rows'] as Record<string, unknown>[]) : [];
        let rejected = 0;
        const valid: RawTx[] = [];
        for (const row of rows) {
          const raw: RawTx = {
            date: row['date'] === undefined || row['date'] === null ? '' : String(row['date']),
            payee: row['label'] === undefined || row['label'] === null ? '' : String(row['label']),
            category: row['category'] === undefined || row['category'] === null ? '' : String(row['category']),
            account: row['account'] === undefined || row['account'] === null ? '' : String(row['account']),
            amount:
              typeof row['amount'] === 'number'
                ? row['amount']
                : row['amount'] === undefined || row['amount'] === null || row['amount'] === ''
                  ? null
                  : Number(row['amount']),
            status: row['status'] === undefined || row['status'] === null ? '' : String(row['status']),
          };
          if (validateTransaction(raw).length === 0) valid.push(raw);
          else rejected += 1;
        }
        const txs = rowsToTransactions(
          valid.map((candidate) => ({
            lineNo: 0,
            cells: [],
            candidate,
            errors: [] as FieldError[],
            fixes: {} as ImportRow['fixes'],
          })),
        );
        if (txs.length > 0) {
          this.store.dispatch(A.importTransactions({ transactions: txs, mode: write }));
          this.toast(`Imported ${txs.length} transactions (${write === 'replace' ? 'Replace all' : 'Append'})`);
        }
        return { ok: true, committed: txs.length, rejected, write };
      }

      case 'artifact_copy': {
        const format = str('format') === 'json' ? 'json' : 'markdown';
        this.store.dispatch(A.openDrawer({ tab: format }));
        const text = await this.reportText(format);
        await this.copyToClipboard(text);
        this.toast('Copied to clipboard');
        return { ok: true, format, confirmation: 'Copied' };
      }

      default:
        return { ok: false, error: `Unknown tool "${name}"` };
    }
  }

  private async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  private async reportText(format: 'json' | 'markdown'): Promise<string> {
    const [txs, filters, burn] = await Promise.all([
      firstValueFrom(this.store.select(selectFilteredTransactions)),
      firstValueFrom(this.store.select(selectFilters)),
      firstValueFrom(this.store.select(selectBurnRate)),
    ]);
    const input = {
      transactions: txs,
      filters,
      burn: { ceiling: burn.ceiling, monthToDate: burn.monthToDate, projectedMonthEnd: burn.projectedMonthEnd, over: burn.over },
    };
    return format === 'json' ? buildJsonReport(input) : buildMarkdownReport(input);
  }

  private async filteredCount(): Promise<number> {
    return (await firstValueFrom(this.store.select(selectFilteredTransactions))).length;
  }

  private async totalCount(): Promise<number> {
    return (await firstValueFrom(this.store.select(selectAllTransactions))).length;
  }
}
