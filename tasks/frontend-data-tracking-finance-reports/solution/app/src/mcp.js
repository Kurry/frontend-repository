import {
  transactions,
  filters,
  displayCurrency,
  filteredTransactions,
  totals,
  sort,
  selection as selectionSignal,
  openCreate,
  openEdit,
  openExport,
  setExportTab,
  openImport,
  commitTransaction,
  deleteTransaction,
  toggleSelect,
  setFilters,
  clearFilters,
  setCurrency,
  setChartTab,
} from './state.js';
import { ACCOUNTS, CATEGORIES, CURRENCIES, STATUSES, isRealIsoDate, transactionSchema } from './schemas.js';

const DESTINATIONS = ['reports-overview', 'category-breakdown', 'transaction-list', 'export-drawer', 'thresholds'];

function formValuesFromEntity(e) {
  if (!e || typeof e !== 'object') return {};
  const out = {};
  if (e.date != null) out.date = String(e.date);
  if (e.label != null) out.label = String(e.label);
  if (e.category != null) out.category = String(e.category);
  if (e.account != null) out.account = String(e.account);
  if (e.amount != null) out.amount = String(e.amount);
  if (e.status != null) out.status = e.status;
  return out;
}

function validateFormValues(values) {
  const r = transactionSchema.safeParse(values);
  if (r.success) return { ok: true, record: { ...r.data, status: r.data.status || '', note: r.data.note || '' } };
  const issues = r.error.issues.map((i) => ({ path: i.path.join('.') || i.code, message: i.message }));
  return { ok: false, issues };
}

function applySort(key, direction) {
  const dir = direction === 'desc' ? 'desc' : 'asc';
  sort.value = { key, dir };
}

const entityProperties = {
  date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
  label: { type: 'string', minLength: 1, maxLength: 80 },
  category: { type: 'string', enum: CATEGORIES },
  account: { type: 'string', enum: ACCOUNTS },
  amount: { type: 'number', minimum: -1000000, maximum: 1000000 },
  status: { type: 'string', enum: STATUSES },
};
const entitySchema = (required = []) => ({ type: 'object', properties: entityProperties, required, additionalProperties: false });

const TOOLS = [
  {
    name: 'browse_open',
    description:
      'Open a bounded destination in the Reports workspace. destinations: reports-overview, category-breakdown (Breakdown sankey), transaction-list, export-drawer, thresholds.',
    inputSchema: {
      type: 'object',
      properties: { destination: { type: 'string', enum: DESTINATIONS } },
      required: ['destination'],
      additionalProperties: false,
    },
  },
  {
    name: 'browse_apply_filter',
    description:
      'Apply one of the bounded filters: category (a closed category name or null), range ({start,end} ISO dates or null), or currency (USD|EUR|GBP).',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', enum: ['category', 'range', 'currency'] },
        value: {
          oneOf: [
            { type: 'string', enum: [...CATEGORIES, ...CURRENCIES] },
            { type: 'object', properties: { start: { type: ['string', 'null'] }, end: { type: ['string', 'null'] } }, additionalProperties: false },
            { type: 'null' },
          ],
        },
      },
      required: ['filter', 'value'],
      additionalProperties: false,
    },
  },
  {
    name: 'browse_clear_filter',
    description: 'Clear all transactions filters (category, type, date range, and search text).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'browse_sort',
    description: 'Sort the transactions table by a bounded key. keys: amount, date. direction: asc|desc.',
    inputSchema: {
      type: 'object',
      properties: { key: { type: 'string', enum: ['amount', 'date'] }, direction: { type: 'string', enum: ['asc', 'desc'] } },
      required: ['key'],
      additionalProperties: false,
    },
  },
  {
    name: 'entity_create',
    description:
      'Create an income/expense transaction using the bound fields (date, label, category, account, signed nonzero amount, and optional status). Surfaces the same inline field errors as the visible create form when invalid.',
    inputSchema: {
      type: 'object',
      properties: {
        entity: entitySchema(['date', 'label', 'category', 'account', 'amount']),
      },
      required: ['entity'],
      additionalProperties: false,
    },
  },
  {
    name: 'entity_select',
    description: 'Set or toggle the checkbox selection state of a transaction row by id (used for bulk flows).',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, selected: { type: 'boolean' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'entity_update',
    description:
      'Update an existing transaction by id using the transaction field contract; surfaces the same inline errors as the visible edit form when invalid.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, entity: { ...entitySchema(), minProperties: 1 } },
      required: ['id', 'entity'],
      additionalProperties: false,
    },
  },
  {
    name: 'entity_delete',
    description: 'Delete a transaction by id. Requires confirm=true.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, confirm: { type: 'boolean' } },
      required: ['id', 'confirm'],
      additionalProperties: false,
    },
  },
  {
    name: 'artifact_export',
    description:
      'Open the Export drawer on the requested tab (json|csv), compiled live from the store. Returns a summary only; the full artifact text is rendered in the drawer and downloaded via the visible Download control.',
    inputSchema: {
      type: 'object',
      properties: { format: { type: 'string', enum: ['json', 'csv'] } },
      required: ['format'],
      additionalProperties: false,
    },
  },
  {
    name: 'artifact_import',
    description:
      'Open the visible ledger-json Replace panel. File selection and pasted artifact contents remain Playwright responsibilities.',
    inputSchema: {
      type: 'object',
      properties: { mode: { type: 'string', enum: ['ledger-json'] } },
      required: ['mode'],
      additionalProperties: false,
    },
  },
  {
    name: 'artifact_copy',
    description:
      'Open the requested export tab and focus its visible Copy control. Clipboard contents remain a Playwright responsibility.',
    inputSchema: {
      type: 'object',
      properties: { format: { type: 'string', enum: ['json', 'csv'] } },
      required: ['format'],
      additionalProperties: false,
    },
  },
];

function summary() {
  return {
    transactions: transactions.value.length,
    filtered: filteredTransactions.value.length,
    totalsCount: totals.value.count,
    displayCurrency: displayCurrency.value,
  };
}

window.webmcp_session_info = () => ({
  contract_version: 'zto-webmcp-v1',
  modules: ['browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1'],
  tools: TOOLS.map((t) => t.name),
});

window.webmcp_list_tools = () => TOOLS;

window.webmcp_invoke_tool = (name, args) => {
  const a = args || {};
  try {
    switch (name) {
      case 'browse_open': {
        const dest = a.destination;
        if (!DESTINATIONS.includes(dest)) return { success: false, error: `Unknown destination: ${dest}` };
        if (dest === 'export-drawer') openExport('json');
        else if (dest === 'category-breakdown') setChartTab('breakdown');
        const map = {
          'reports-overview': 'ld-main',
          'category-breakdown': 'ld-chart',
          'transaction-list': 'ld-table',
          thresholds: 'ld-thresholds',
        };
        if (map[dest]) {
          const el = document.getElementById(map[dest]);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return { success: true, destination: dest, visible: true };
      }
      case 'browse_apply_filter': {
        if (a.filter === 'category') {
          if (a.value !== null && !CATEGORIES.includes(a.value)) return { success: false, error: 'category must be a declared category or null' };
          setFilters({ category: a.value });
        }
        else if (a.filter === 'range') {
          const v = a.value;
          if (!v || typeof v !== 'object' || Array.isArray(v)) return { success: false, error: 'range must provide start and end dates' };
          const start = v.start ?? null;
          const end = v.end ?? null;
          if ((start !== null && !isRealIsoDate(start)) || (end !== null && !isRealIsoDate(end))) return { success: false, error: 'range dates must be ISO YYYY-MM-DD or null' };
          if (start && end && start > end) return { success: false, error: 'range start must not be after end' };
          setFilters({ dateStart: start, dateEnd: end });
        } else if (a.filter === 'currency') {
          if (['USD', 'EUR', 'GBP'].includes(a.value)) setCurrency(a.value);
          else return { success: false, error: 'currency must be USD, EUR, or GBP' };
        } else return { success: false, error: `Unknown filter: ${a.filter}` };
        return { success: true, filters: filters.value, ...summary() };
      }
      case 'browse_clear_filter':
        clearFilters();
        return { success: true, filters: filters.value, ...summary() };
      case 'browse_sort': {
        if (!['amount', 'date'].includes(a.key)) return { success: false, error: 'key must be amount or date' };
        applySort(a.key, a.direction);
        return { success: true, sort: sort.value, ...summary() };
      }
      case 'entity_create': {
        const values = formValuesFromEntity(a.entity);
        const v = validateFormValues(values);
        if (!v.ok) {
          openCreate(values, true);
          return { success: false, error: 'Validation failed', errors: v.issues, dialogOpen: true };
        }
        commitTransaction(v.record, null);
        return { success: true, result: 'created', ...summary() };
      }
      case 'entity_select': {
        if (!a.id) return { success: false, error: 'id required' };
        if (!transactions.value.some((t) => t.id === a.id)) return { success: false, error: 'Unknown transaction id' };
        const selected = selectionSignal.value.includes(a.id);
        if (typeof a.selected === 'boolean' ? a.selected !== selected : true) toggleSelect(a.id);
        return { success: true, id: a.id, selected: selectionSignal.value.includes(a.id) };
      }
      case 'entity_update': {
        const target = transactions.value.find((t) => t.id === a.id);
        if (!target) return { success: false, error: 'Unknown transaction id' };
        const merged = {
          date: target.date,
          label: target.label,
          category: target.category,
          account: target.account,
          amount: target.amount,
          status: target.status || '',
          note: target.note || '',
          ...formValuesFromEntity(a.entity),
        };
        const v = validateFormValues(merged);
        if (!v.ok) {
          openEdit({ ...target, ...merged }, true);
          return { success: false, error: 'Validation failed', errors: v.issues, dialogOpen: true };
        }
        commitTransaction(v.record, a.id);
        return { success: true, result: 'updated', ...summary() };
      }
      case 'entity_delete': {
        if (a.confirm !== true) return { success: false, error: 'confirm=true required to delete' };
        if (!transactions.value.some((t) => t.id === a.id)) return { success: false, error: 'Unknown transaction id' };
        deleteTransaction(a.id);
        return { success: true, result: 'deleted', ...summary() };
      }
      case 'artifact_export': {
        if (!['json', 'csv'].includes(a.format)) return { success: false, error: 'format must be json or csv' };
        const fmt = a.format === 'csv' ? 'csv' : 'json';
        openExport(fmt);
        setExportTab(fmt);
        return { success: true, format: fmt, drawerOpen: true, ...summary() };
      }
      case 'artifact_import': {
        if (a.mode !== 'ledger-json') return { success: false, error: 'mode must be ledger-json' };
        openImport();
        window.setTimeout(() => document.getElementById('ld-import-text')?.focus(), 50);
        return { success: true, mode: 'ledger-json', panelOpen: true, message: 'Paste or choose a ledger JSON document in the visible panel.' };
      }
      case 'artifact_copy': {
        if (!['json', 'csv'].includes(a.format)) return { success: false, error: 'format must be json or csv' };
        const fmt = a.format === 'csv' ? 'csv' : 'json';
        openExport(fmt);
        setExportTab(fmt);
        window.setTimeout(() => document.getElementById('ld-export-copy')?.focus(), 50);
        return { success: true, format: fmt, drawerOpen: true, message: 'Activate the focused Copy control.' };
      }
      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { success: false, error: err && err.message ? err.message : String(err) };
  }
};
