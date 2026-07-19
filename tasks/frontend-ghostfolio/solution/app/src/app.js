// Ghostfolio oracle — self-contained portfolio dashboard.
// Vanilla JS. State lives in module scope; holdings persist to localStorage so a
// reload restores them with no login. The WebMCP handlers call the SAME domain
// functions as the visible UI controls.

const STORAGE_KEY = 'ghostfolio.holdings.v1';
const ASSET_CLASSES = ['Equity', 'ETF', 'Cash', 'Crypto'];

const SEED_HOLDINGS = [
  { id: 'h-aapl', name: 'Apple Inc.', symbol: 'AAPL', assetClass: 'Equity', quantity: 12, unitPrice: 2381 / 12 },
  { id: 'h-vt', name: 'Vanguard Total World', symbol: 'VT', assetClass: 'ETF', quantity: 40, unitPrice: 112.2 },
  { id: 'h-usd', name: 'USD Cash', symbol: 'USD', assetClass: 'Cash', quantity: 8500, unitPrice: 1 },
  { id: 'h-btc', name: 'Bitcoin', symbol: 'BTC', assetClass: 'Crypto', quantity: 0.35, unitPrice: 64000 }
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  holdings: loadHoldings(),
  filter: 'all',        // 'all' or one of ASSET_CLASSES
  selectedId: null,
  editingId: null       // holding id currently loaded into the form, or null (create mode)
};

let seq = 0;
function nextId() {
  seq += 1;
  return `h-${Date.now().toString(36)}-${seq}`;
}

function loadHoldings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map((h) => ({
          id: String(h.id),
          name: String(h.name),
          symbol: String(h.symbol),
          assetClass: ASSET_CLASSES.includes(h.assetClass) ? h.assetClass : 'Equity',
          quantity: Number(h.quantity) || 0,
          unitPrice: Number(h.unitPrice) || 0
        }));
      }
    }
  } catch (_) {
    /* fall through to seed */
  }
  return SEED_HOLDINGS.map((h) => ({ ...h }));
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.holdings));
  } catch (_) {
    /* storage may be unavailable; app still works in-memory */
  }
}

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------
const valueOf = (h) => h.quantity * h.unitPrice;

function visibleHoldings() {
  if (state.filter === 'all') return state.holdings;
  return state.holdings.filter((h) => h.assetClass === state.filter);
}

function netWorth(list) {
  return list.reduce((sum, h) => sum + valueOf(h), 0);
}

// Largest-remainder rounding so displayed percentages always sum to 100.
function allocationRows(list) {
  const total = netWorth(list);
  const byClass = new Map();
  for (const h of list) {
    byClass.set(h.assetClass, (byClass.get(h.assetClass) || 0) + valueOf(h));
  }
  const entries = [...byClass.entries()].sort((a, b) => b[1] - a[1]);
  if (total <= 0) return entries.map(([name]) => ({ name, pct: 0, raw: 0 }));

  const raw = entries.map(([name, val]) => ({ name, val, exact: (val / total) * 100 }));
  const floored = raw.map((r) => ({ ...r, floor: Math.floor(r.exact), rem: r.exact - Math.floor(r.exact) }));
  let remaining = 100 - floored.reduce((s, r) => s + r.floor, 0);
  floored.sort((a, b) => b.rem - a.rem);
  for (let i = 0; i < floored.length && remaining > 0; i += 1) {
    floored[i].floor += 1;
    remaining -= 1;
  }
  floored.sort((a, b) => b.val - a.val);
  return floored.map((r) => ({ name: r.name, pct: r.floor, raw: r.val }));
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
function qtyText(n) {
  if (Number.isInteger(n)) return n.toLocaleString('en-US');
  return String(Number(n.toFixed(6)));
}

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------
const el = (id) => document.getElementById(id);
const refs = {};

// ---------------------------------------------------------------------------
// Domain commands (shared by UI + WebMCP)
// ---------------------------------------------------------------------------
function applyFilter(value) {
  const next = value === 'all' || ASSET_CLASSES.includes(value) ? value : 'all';
  state.filter = next;
  // If the selected holding is no longer visible, drop the selection.
  if (state.selectedId && !visibleHoldings().some((h) => h.id === state.selectedId)) {
    clearSelection();
  }
  render();
  return { filter: state.filter, visibleCount: visibleHoldings().length };
}

function clearFilter() {
  return applyFilter('all');
}

function createHolding(data) {
  const holding = normalizeInput(data);
  const validation = validate(holding);
  if (!validation.ok) return { ok: false, error: validation.error };
  holding.id = nextId();
  state.holdings.push(holding);
  state.selectedId = holding.id;
  state.editingId = null;
  persist();
  render();
  announce(`Added ${holding.name}`);
  return { ok: true, id: holding.id, netWorth: netWorth(visibleHoldings()) };
}

function updateHolding(id, data) {
  const idx = state.holdings.findIndex((h) => h.id === id);
  if (idx === -1) return { ok: false, error: 'Holding not found' };
  const merged = normalizeInput({ ...state.holdings[idx], ...data });
  const validation = validate(merged);
  if (!validation.ok) return { ok: false, error: validation.error };
  merged.id = id;
  state.holdings[idx] = merged;
  state.selectedId = id;
  persist();
  render();
  announce(`Updated ${merged.name}`);
  return { ok: true, id, netWorth: netWorth(visibleHoldings()) };
}

function deleteHolding(id, confirm) {
  if (confirm !== true) return { ok: false, error: 'Delete requires confirm=true' };
  const holding = state.holdings.find((h) => h.id === id);
  if (!holding) return { ok: false, error: 'Holding not found' };
  state.holdings = state.holdings.filter((h) => h.id !== id);
  if (state.selectedId === id) clearSelection();
  if (state.editingId === id) resetForm();
  persist();
  render();
  announce(`Removed ${holding.name}`);
  return { ok: true, id };
}

function selectHolding(id) {
  const holding = state.holdings.find((h) => h.id === id);
  if (!holding) return { ok: false, error: 'Holding not found' };
  state.selectedId = id;
  loadIntoForm(holding);
  render();
  return { ok: true, id, name: holding.name };
}

function clearSelection() {
  state.selectedId = null;
  if (!state.editingId) resetForm();
}

function normalizeInput(data) {
  return {
    id: data.id,
    name: String(data.name ?? '').trim(),
    symbol: String(data.symbol ?? '').trim().toUpperCase(),
    assetClass: ASSET_CLASSES.includes(data.assetClass) ? data.assetClass : 'Equity',
    quantity: Number(data.quantity),
    unitPrice: Number(data.unitPrice)
  };
}

function validate(h) {
  if (!h.name) return { ok: false, error: 'Enter a name for the holding.' };
  if (!h.symbol) return { ok: false, error: 'Enter a ticker symbol.' };
  if (!Number.isFinite(h.quantity) || h.quantity <= 0) return { ok: false, error: 'Enter a quantity greater than 0.' };
  if (!Number.isFinite(h.unitPrice) || h.unitPrice < 0) return { ok: false, error: 'Enter a unit price of 0 or more.' };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Form handling
// ---------------------------------------------------------------------------
function loadIntoForm(holding) {
  state.editingId = holding.id;
  refs.fName.value = holding.name;
  refs.fSymbol.value = holding.symbol;
  refs.fClass.value = holding.assetClass;
  refs.fQty.value = String(holding.quantity);
  refs.fPrice.value = String(Number(holding.unitPrice.toFixed(6)));
  refs.saveBtn.textContent = 'Save holding';
  hideError();
}

function resetForm() {
  state.editingId = null;
  refs.form.reset();
  refs.fClass.value = 'Equity';
  refs.saveBtn.textContent = 'Save holding';
  hideError();
}

function beginAdd() {
  state.editingId = null;
  state.selectedId = null;
  refs.form.reset();
  refs.fClass.value = 'Equity';
  refs.saveBtn.textContent = 'Save holding';
  hideError();
  render();
  refs.fName.focus();
}

function submitForm(event) {
  event.preventDefault();
  const data = {
    name: refs.fName.value,
    symbol: refs.fSymbol.value,
    assetClass: refs.fClass.value,
    quantity: refs.fQty.value,
    unitPrice: refs.fPrice.value
  };
  const result = state.editingId ? updateHolding(state.editingId, data) : createHolding(data);
  if (!result.ok) {
    showError(result.error);
    return;
  }
  hideError();
  resetForm();
}

function showError(message) {
  refs.formError.textContent = message;
  refs.formError.hidden = false;
}
function hideError() {
  refs.formError.textContent = '';
  refs.formError.hidden = true;
}
function announce(message) {
  refs.live.textContent = message;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function render() {
  const list = visibleHoldings();
  const total = netWorth(list);
  const classCount = new Set(list.map((h) => h.assetClass)).size;

  refs.netWorth.textContent = money(total);
  const hLabel = `${list.length} holding${list.length === 1 ? '' : 's'} visible`;
  const cLabel = `${classCount} class${classCount === 1 ? '' : 'es'}`;
  refs.meta.textContent = `${hLabel} · ${cLabel}`;

  renderAllocation(list);
  renderTable(list);
  renderDetail();
  syncFilterControl();
}

function renderAllocation(list) {
  const rows = allocationRows(list);
  refs.allocation.innerHTML = '';
  if (!rows.length) {
    const li = document.createElement('li');
    li.className = 'allocation-row';
    li.innerHTML = '<span class="allocation-name">No data</span>';
    refs.allocation.appendChild(li);
    return;
  }
  const max = Math.max(...rows.map((r) => r.pct), 1);
  for (const row of rows) {
    const li = document.createElement('li');
    li.className = 'allocation-row';
    const width = Math.max(4, (row.pct / max) * 100);
    li.innerHTML =
      `<span class="allocation-name">${escapeHtml(row.name)}</span>` +
      `<span class="allocation-bar"><span class="allocation-fill" style="width:${width}%"></span></span>` +
      `<span class="allocation-pct">${row.pct}%</span>`;
    refs.allocation.appendChild(li);
  }
}

function renderTable(list) {
  refs.body.innerHTML = '';
  refs.emptyState.hidden = list.length > 0;
  for (const h of list) {
    const tr = document.createElement('tr');
    tr.dataset.id = h.id;
    tr.tabIndex = 0;
    tr.setAttribute('role', 'button');
    tr.setAttribute('aria-pressed', String(h.id === state.selectedId));
    tr.setAttribute('aria-label', `${h.name}, ${h.assetClass}, ${money(valueOf(h))}`);
    if (h.id === state.selectedId) tr.classList.add('selected');
    tr.innerHTML =
      `<td>${escapeHtml(h.name)}</td>` +
      `<td class="cell-symbol">${escapeHtml(h.symbol)}</td>` +
      `<td>${escapeHtml(h.assetClass)}</td>` +
      `<td class="num">${qtyText(h.quantity)}</td>` +
      `<td class="num">${money(valueOf(h))}</td>`;
    refs.body.appendChild(tr);
  }
}

function renderDetail() {
  const holding = state.holdings.find((h) => h.id === state.selectedId);
  if (!holding) {
    refs.detailName.textContent = 'No holding selected';
    refs.detailList.hidden = true;
    refs.detailEmpty.hidden = false;
    refs.detailActions.hidden = true;
    return;
  }
  refs.detailName.textContent = holding.name;
  refs.dSymbol.textContent = holding.symbol;
  refs.dClass.textContent = holding.assetClass;
  refs.dQty.textContent = qtyText(holding.quantity);
  refs.dPrice.textContent = money(holding.unitPrice);
  refs.dValue.textContent = money(valueOf(holding));
  refs.detailList.hidden = false;
  refs.detailEmpty.hidden = true;
  refs.detailActions.hidden = false;
}

function syncFilterControl() {
  if (refs.filter.value !== state.filter) refs.filter.value = state.filter;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
function buildFilterOptions() {
  const opts = [['all', 'All classes'], ...ASSET_CLASSES.map((c) => [c, c])];
  refs.filter.innerHTML = opts
    .map(([v, label]) => `<option value="${v}">${label}</option>`)
    .join('');
  refs.fClass.innerHTML = ASSET_CLASSES.map((c) => `<option value="${c}">${c}</option>`).join('');
  refs.fClass.value = 'Equity';
}

function wire() {
  refs.filter = el('class-filter');
  refs.netWorth = el('net-worth');
  refs.meta = el('portfolio-meta');
  refs.allocation = el('allocation-list');
  refs.body = el('holdings-body');
  refs.emptyState = el('empty-state');
  refs.addBtn = el('add-holding-btn');
  refs.form = el('holding-form');
  refs.fName = el('f-name');
  refs.fSymbol = el('f-symbol');
  refs.fClass = el('f-class');
  refs.fQty = el('f-qty');
  refs.fPrice = el('f-price');
  refs.saveBtn = el('save-holding-btn');
  refs.formError = el('form-error');
  refs.detailName = el('detail-name');
  refs.detailList = el('detail-list');
  refs.detailEmpty = el('detail-empty');
  refs.detailActions = el('detail-actions');
  refs.deleteBtn = el('delete-holding-btn');
  refs.dSymbol = el('d-symbol');
  refs.dClass = el('d-class');
  refs.dQty = el('d-qty');
  refs.dPrice = el('d-price');
  refs.dValue = el('d-value');
  refs.live = el('live-region');

  buildFilterOptions();

  refs.filter.addEventListener('change', (e) => applyFilter(e.target.value));
  refs.addBtn.addEventListener('click', beginAdd);
  refs.form.addEventListener('submit', submitForm);
  refs.deleteBtn.addEventListener('click', () => {
    if (state.selectedId) deleteHolding(state.selectedId, true);
  });
  refs.body.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) selectHolding(tr.dataset.id);
  });
  refs.body.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const tr = e.target.closest('tr[data-id]');
    if (tr) {
      e.preventDefault();
      selectHolding(tr.dataset.id);
    }
  });

  render();
  registerWebMcp();
}

// ---------------------------------------------------------------------------
// WebMCP surface — one tool per supported op; handlers call the same domain
// commands the visible controls use.
// ---------------------------------------------------------------------------
function registerWebMcp() {
  const tools = [
    {
      name: 'browse.open',
      module: 'browse-query-v1',
      description: 'Open a destination view. Only "portfolio-overview" exists.',
      input_schema: { type: 'object', properties: { destination: { type: 'string', enum: ['portfolio-overview'] } } },
      handler: (args = {}) => {
        const dest = args.destination || 'portfolio-overview';
        if (dest !== 'portfolio-overview') return { ok: false, error: 'Unknown destination' };
        window.scrollTo({ top: 0 });
        return { ok: true, destination: 'portfolio-overview' };
      }
    },
    {
      name: 'browse.apply_filter',
      module: 'browse-query-v1',
      description: 'Filter holdings by asset class.',
      input_schema: {
        type: 'object',
        required: ['filter', 'value'],
        properties: {
          filter: { type: 'string', enum: ['asset-class'] },
          value: { type: 'string', enum: ASSET_CLASSES }
        }
      },
      handler: (args = {}) => {
        if (args.filter && args.filter !== 'asset-class') return { ok: false, error: 'Unknown filter' };
        if (!ASSET_CLASSES.includes(args.value)) return { ok: false, error: 'Unknown asset class' };
        return { ok: true, ...applyFilter(args.value) };
      }
    },
    {
      name: 'browse.clear_filter',
      module: 'browse-query-v1',
      description: 'Clear the asset-class filter and show all holdings.',
      input_schema: { type: 'object', properties: { filter: { type: 'string', enum: ['asset-class'] } } },
      handler: () => ({ ok: true, ...clearFilter() })
    },
    {
      name: 'entity.create',
      module: 'entity-collection-v1',
      description: 'Create a holding (same as the Add holding form).',
      input_schema: {
        type: 'object',
        required: ['name', 'symbol', 'asset_class', 'quantity', 'unit_price'],
        properties: {
          name: { type: 'string' },
          symbol: { type: 'string' },
          asset_class: { type: 'string', enum: ASSET_CLASSES },
          quantity: { type: 'number', minimum: 0 },
          unit_price: { type: 'number', minimum: 0 }
        }
      },
      handler: (args = {}) => createHolding({
        name: args.name,
        symbol: args.symbol,
        assetClass: args.asset_class,
        quantity: args.quantity,
        unitPrice: args.unit_price
      })
    },
    {
      name: 'entity.select',
      module: 'entity-collection-v1',
      description: 'Select a holding by id to show its detail panel.',
      input_schema: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
      handler: (args = {}) => selectHolding(args.id)
    },
    {
      name: 'entity.update',
      module: 'entity-collection-v1',
      description: 'Update fields of an existing holding.',
      input_schema: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          symbol: { type: 'string' },
          asset_class: { type: 'string', enum: ASSET_CLASSES },
          quantity: { type: 'number', minimum: 0 },
          unit_price: { type: 'number', minimum: 0 }
        }
      },
      handler: (args = {}) => {
        const patch = {};
        if (args.name !== undefined) patch.name = args.name;
        if (args.symbol !== undefined) patch.symbol = args.symbol;
        if (args.asset_class !== undefined) patch.assetClass = args.asset_class;
        if (args.quantity !== undefined) patch.quantity = args.quantity;
        if (args.unit_price !== undefined) patch.unitPrice = args.unit_price;
        return updateHolding(args.id, patch);
      }
    },
    {
      name: 'entity.delete',
      module: 'entity-collection-v1',
      description: 'Delete a holding. Requires confirm=true.',
      input_schema: {
        type: 'object',
        required: ['id', 'confirm'],
        properties: { id: { type: 'string' }, confirm: { type: 'boolean' } }
      },
      handler: (args = {}) => deleteHolding(args.id, args.confirm === true)
    }
  ];

  const registry = new Map(tools.map((t) => [t.name, t]));

  window.webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    app: 'ghostfolio',
    modules: ['browse-query-v1', 'entity-collection-v1'],
    tool_count: tools.length
  });
  window.webmcp_list_tools = () => tools.map((t) => ({
    name: t.name,
    module: t.module,
    description: t.description,
    input_schema: t.input_schema
  }));
  window.webmcp_invoke_tool = (name, args) => {
    const tool = registry.get(name);
    if (!tool) return { ok: false, error: `Unknown tool: ${name}` };
    try {
      return tool.handler(args || {});
    } catch (err) {
      return { ok: false, error: String((err && err.message) || err) };
    }
  };

  // Optional navigator.modelContext mirror.
  try {
    if (navigator && typeof navigator === 'object') {
      navigator.modelContext = navigator.modelContext || {};
      navigator.modelContext.tools = window.webmcp_list_tools();
      navigator.modelContext.invoke = window.webmcp_invoke_tool;
    }
  } catch (_) {
    /* non-fatal */
  }
}

// ---------------------------------------------------------------------------
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wire);
} else {
  wire();
}
