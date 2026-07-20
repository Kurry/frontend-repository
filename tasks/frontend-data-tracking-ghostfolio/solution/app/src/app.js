// Ghostfolio oracle — self-contained wealth portfolio dashboard (vanilla JS).
// One shared store drives holdings, activities, filters, sort, selection, batch
// selection, import staging, benchmark toggle, undo history, export previews, and
// the derived position math. WebMCP handlers call the SAME domain commands as the
// visible UI controls. Holdings + activities persist to localStorage so a reload
// restores state with no login.

const STORAGE_KEY = 'ghostfolio.store.v2';
const ASSET_CLASSES = ['Equity', 'ETF', 'Cash', 'Crypto'];
const CURRENCIES = ['USD', 'EUR', 'CHF'];
const DATA_SOURCES = ['MANUAL', 'YAHOO', 'COINGECKO'];
const ACTIVITY_TYPES = ['BUY', 'SELL', 'DIVIDEND', 'FEE', 'INTEREST', 'LIABILITY'];
const SYMBOL_RE = /^[A-Za-z0-9.\-]{1,12}$/;
const BENCH_REF = Date.UTC(2020, 0, 1);
const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; }
};

const SEED_HOLDINGS = [
  { id: 'h-aapl', name: 'Apple Inc.', symbol: 'AAPL', assetClass: 'Equity', quantity: 12, unitPrice: 198.4, currency: 'USD', dataSource: 'YAHOO' },
  { id: 'h-vt', name: 'Vanguard Total World', symbol: 'VT', assetClass: 'ETF', quantity: 40, unitPrice: 112.2, currency: 'USD', dataSource: 'YAHOO' },
  { id: 'h-usd', name: 'USD Cash', symbol: 'USD', assetClass: 'Cash', quantity: 8500, unitPrice: 1, currency: 'USD', dataSource: 'MANUAL' },
  { id: 'h-btc', name: 'Bitcoin', symbol: 'BTC', assetClass: 'Crypto', quantity: 0.35, unitPrice: 64000, currency: 'USD', dataSource: 'COINGECKO' }
];

const SEED_ACTIVITIES = [
  { id: 'a-1', currency: 'USD', dataSource: 'YAHOO', date: '2021-03-10T00:00:00.000Z', fee: 4.95, quantity: 12, symbol: 'AAPL', type: 'BUY', unitPrice: 121, comment: 'Initial position' },
  { id: 'a-2', currency: 'USD', dataSource: 'YAHOO', date: '2021-08-15T00:00:00.000Z', fee: 3.5, quantity: 40, symbol: 'VT', type: 'BUY', unitPrice: 98.4, comment: '' },
  { id: 'a-3', currency: 'USD', dataSource: 'COINGECKO', date: '2022-01-05T00:00:00.000Z', fee: 8, quantity: 0.35, symbol: 'BTC', type: 'BUY', unitPrice: 42000, comment: 'DCA' },
  { id: 'a-4', currency: 'USD', dataSource: 'YAHOO', date: '2022-06-20T00:00:00.000Z', fee: 0, quantity: 12, symbol: 'AAPL', type: 'DIVIDEND', unitPrice: 0.23, comment: 'Quarterly dividend' }
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
const state = {
  holdings: [],
  activities: [],
  filter: 'all',
  activityFilter: 'all',
  sort: null, // { col, dir }
  selectedId: null,
  editingId: null,
  holdingSel: new Set(),
  activitySel: new Set(),
  benchmarkOn: false,
  drawerTab: 'json',
  diag: null // import staging state or null
};

let seq = 0;
function nextId(prefix) { seq += 1; return `${prefix}-${Date.now().toString(36)}-${seq}`; }

const undoStack = [];
function snapshot() {
  return {
    holdings: state.holdings.map((h) => ({ ...h })),
    activities: state.activities.map((a) => ({ ...a })),
    selectedId: state.selectedId,
    filter: state.filter,
    activityFilter: state.activityFilter,
    sort: state.sort ? { ...state.sort } : null,
    holdingSel: [...state.holdingSel],
    activitySel: [...state.activitySel],
    benchmarkOn: state.benchmarkOn
  };
}
function pushUndo() { undoStack.push(snapshot()); }
function restore(snap) {
  state.holdings = snap.holdings.map((h) => ({ ...h }));
  state.activities = snap.activities.map((a) => ({ ...a }));
  state.selectedId = snap.selectedId;
  state.filter = snap.filter;
  state.activityFilter = snap.activityFilter;
  state.sort = snap.sort ? { ...snap.sort } : null;
  state.holdingSel = new Set(snap.holdingSel);
  state.activitySel = new Set(snap.activitySel);
  state.benchmarkOn = snap.benchmarkOn;
}
function undo() {
  if (!undoStack.length) return { ok: false, error: 'Nothing to undo' };
  const snap = undoStack.pop();
  restore(snap);
  if (state.editingId && !state.holdings.some((h) => h.id === state.editingId)) resetHoldingForm();
  // Drop any in-flight delete exit animations: undo may have already restored
  // the same holding, and a stale ghost row would otherwise render alongside it.
  exitingRows = [];
  persist();
  render();
  announce('Reverted last action');
  toast('Reverted last action');
  return { ok: true };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.holdings) && Array.isArray(parsed.activities)) {
        state.holdings = parsed.holdings.map(coerceHolding).filter(Boolean);
        state.activities = parsed.activities.map(coerceActivity).filter(Boolean);
        return;
      }
    }
  } catch (_) { /* fall through to seed */ }
  state.holdings = SEED_HOLDINGS.map((h) => ({ ...h }));
  state.activities = SEED_ACTIVITIES.map((a) => ({ ...a }));
}
function coerceHolding(h) {
  if (!h || typeof h !== 'object') return null;
  return {
    id: String(h.id || nextId('h')),
    name: String(h.name ?? ''),
    symbol: String(h.symbol ?? ''),
    assetClass: ASSET_CLASSES.includes(h.assetClass) ? h.assetClass : 'Equity',
    quantity: Number(h.quantity) || 0,
    unitPrice: Number(h.unitPrice) || 0,
    currency: CURRENCIES.includes(h.currency) ? h.currency : 'USD',
    dataSource: DATA_SOURCES.includes(h.dataSource) ? h.dataSource : 'MANUAL'
  };
}
function coerceActivity(a) {
  if (!a || typeof a !== 'object') return null;
  return {
    id: String(a.id || nextId('a')),
    currency: CURRENCIES.includes(a.currency) ? a.currency : 'USD',
    dataSource: DATA_SOURCES.includes(a.dataSource) ? a.dataSource : 'MANUAL',
    date: String(a.date || ''),
    fee: Number(a.fee) || 0,
    quantity: Number(a.quantity) || 0,
    symbol: String(a.symbol ?? ''),
    type: ACTIVITY_TYPES.includes(a.type) ? a.type : 'BUY',
    unitPrice: Number(a.unitPrice) || 0,
    comment: String(a.comment ?? '')
  };
}
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ holdings: state.holdings, activities: state.activities }));
  } catch (_) { /* storage optional */ }
}

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------
const marketValueOf = (h) => h.quantity * h.unitPrice;

function visibleHoldings() {
  let list = state.filter === 'all' ? state.holdings.slice() : state.holdings.filter((h) => h.assetClass === state.filter);
  if (state.sort) {
    const { col, dir } = state.sort;
    const mul = dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let av; let bv;
      if (col === 'marketValue') { av = marketValueOf(a); bv = marketValueOf(b); }
      else { av = a[col]; bv = b[col]; }
      if (typeof av === 'string') return av.localeCompare(bv) * mul;
      return (av - bv) * mul;
    });
  }
  return list;
}
function visibleActivities() {
  const list = state.activityFilter === 'all'
    ? state.activities.slice()
    : state.activities.filter((a) => a.type === state.activityFilter);
  return list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
function netWorth(list) { return list.reduce((s, h) => s + marketValueOf(h), 0); }

function allocationRows(list) {
  const total = netWorth(list);
  const byClass = new Map();
  for (const h of list) byClass.set(h.assetClass, (byClass.get(h.assetClass) || 0) + marketValueOf(h));
  const entries = [...byClass.entries()].sort((a, b) => b[1] - a[1]);
  if (total <= 0) return entries.map(([name]) => ({ name, pct: 0, raw: 0 }));
  const raw = entries.map(([name, val]) => ({ name, val, exact: (val / total) * 100 }));
  const floored = raw.map((r) => ({ ...r, floor: Math.floor(r.exact), rem: r.exact - Math.floor(r.exact) }));
  let remaining = 100 - floored.reduce((s, r) => s + r.floor, 0);
  floored.sort((a, b) => b.rem - a.rem);
  for (let i = 0; i < floored.length && remaining > 0; i += 1) { floored[i].floor += 1; remaining -= 1; }
  floored.sort((a, b) => b.val - a.val);
  return floored.map((r) => ({ name: r.name, pct: r.floor, raw: r.val }));
}

// Position math derived from the activities ledger.
function symbolStats(symbol) {
  const acts = state.activities.filter((a) => a.symbol === symbol);
  let buyCost = 0; let buyQty = 0;
  for (const a of acts) if (a.type === 'BUY') { buyCost += a.quantity * a.unitPrice; buyQty += a.quantity; }
  const holding = state.holdings.find((h) => h.symbol === symbol);
  const avgUnitCost = buyQty > 0 ? buyCost / buyQty : (holding ? holding.unitPrice : 0);
  let realized = 0;
  for (const a of acts) if (a.type === 'SELL') realized += (a.unitPrice - avgUnitCost) * a.quantity;
  return { avgUnitCost, realized, buyQty, buyCost };
}
function holdingMetrics(h) {
  const { avgUnitCost, realized } = symbolStats(h.symbol);
  const marketValue = marketValueOf(h);
  const costBasis = avgUnitCost * h.quantity;
  return { marketValue, avgUnitCost, costBasis, unrealized: marketValue - costBasis, realized };
}
function perfSummary() {
  const symbols = new Set([...state.holdings.map((h) => h.symbol), ...state.activities.map((a) => a.symbol)]);
  let netWorthAll = 0; let totalCostBasis = 0; let unrealizedGain = 0; let realizedGain = 0;
  for (const h of state.holdings) {
    const m = holdingMetrics(h);
    netWorthAll += m.marketValue; totalCostBasis += m.costBasis; unrealizedGain += m.unrealized;
  }
  for (const sym of symbols) realizedGain += symbolStats(sym).realized;
  let dividendIncome = 0; let totalFees = 0;
  for (const a of state.activities) {
    if (a.type === 'DIVIDEND') dividendIncome += a.quantity * a.unitPrice;
    totalFees += a.fee;
  }
  const totalReturn = unrealizedGain + realizedGain + dividendIncome - totalFees;
  return { netWorth: netWorthAll, totalCostBasis, realizedGain, unrealizedGain, dividendIncome, totalFees, totalReturn };
}

// Portfolio-value time series. Value at each bucket = cumulative positions held on
// that date times their most recent unit price up to that date.
function seriesData() {
  const dates = [...new Set(state.activities.map((a) => a.date))].filter(Boolean).sort();
  const symbols = [...new Set(state.activities.map((a) => a.symbol))];
  return dates.map((d) => {
    let value = 0;
    for (const sym of symbols) {
      const upTo = state.activities.filter((a) => a.symbol === sym && a.date <= d);
      let qty = 0; let price = 0;
      for (const a of upTo) {
        if (a.type === 'BUY') qty += a.quantity;
        else if (a.type === 'SELL') qty -= a.quantity;
        if ((a.type === 'BUY' || a.type === 'SELL') && a.unitPrice > 0) price = a.unitPrice;
      }
      const holding = state.holdings.find((h) => h.symbol === sym);
      if (price === 0 && holding) price = holding.unitPrice;
      value += qty * price;
    }
    return { date: d, value: Math.round(value * 100) / 100 };
  });
}
function benchAt(dateStr) {
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return 10000;
  return Math.round(10000 * (1 + ((t - BENCH_REF) / YEAR_MS) * 0.08) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
const money = (n) => {
  const neg = n < 0;
  const s = `$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
  return neg ? `-${s}` : s;
};
const signedMoney = (n) => (n >= 0 ? `+${money(n)}` : money(n));
function qtyText(n) { return Number.isInteger(n) ? n.toLocaleString('en-US') : String(Number(n.toFixed(6))); }
function priceText(n) { return `$${Number(n.toFixed(2)).toLocaleString('en-US', { minimumFractionDigits: 0 })}`; }
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validateHolding(h) {
  const errors = {};
  const name = String(h.name ?? '').trim();
  const symbol = String(h.symbol ?? '').trim();
  const qty = Number(h.quantity);
  const price = Number(h.unitPrice);
  if (!name) errors.name = 'Name is required.';
  else if (name.length > 80) errors.name = 'Name must be at most 80 characters.';
  if (!symbol) errors.symbol = 'Symbol is required.';
  else if (!SYMBOL_RE.test(symbol)) errors.symbol = 'Symbol must be 1–12 characters: letters, digits, period, or hyphen.';
  if (!ASSET_CLASSES.includes(h.assetClass)) errors.assetClass = 'Asset class must be Equity, ETF, Cash, or Crypto.';
  if (!Number.isFinite(qty) || qty <= 0) errors.quantity = 'Quantity must be a number greater than 0.';
  if (!Number.isFinite(price) || price < 0) errors.unitPrice = 'Unit price must be a number of 0 or more.';
  if (!CURRENCIES.includes(h.currency)) errors.currency = 'Currency must be USD, EUR, or CHF.';
  if (!DATA_SOURCES.includes(h.dataSource)) errors.dataSource = 'Data source must be MANUAL, YAHOO, or COINGECKO.';
  // Cross-field rules
  if (h.assetClass === 'Cash' && !errors.symbol && !errors.currency && symbol.toUpperCase() !== h.currency) {
    errors.symbol = `Symbol must match the currency code ${h.currency} for a Cash holding.`;
  }
  if (h.assetClass === 'Crypto' && !errors.dataSource && !['COINGECKO', 'MANUAL'].includes(h.dataSource)) {
    errors.dataSource = 'Data source for a Crypto holding must be COINGECKO or MANUAL.';
  }
  if ((h.assetClass === 'Equity' || h.assetClass === 'ETF') && !errors.dataSource && !['YAHOO', 'MANUAL'].includes(h.dataSource)) {
    errors.dataSource = 'Data source for an Equity or ETF holding must be YAHOO or MANUAL.';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

function validateActivity(a) {
  const errors = {};
  const symbol = String(a.symbol ?? '').trim();
  const qty = Number(a.quantity);
  const price = Number(a.unitPrice);
  const fee = Number(a.fee);
  const comment = String(a.comment ?? '');
  if (!CURRENCIES.includes(a.currency)) errors.currency = 'Currency must be USD, EUR, or CHF.';
  if (!DATA_SOURCES.includes(a.dataSource)) errors.dataSource = 'Data source must be MANUAL, YAHOO, or COINGECKO.';
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(String(a.date))) errors.date = 'Date is required (ISO-8601 ending with Z).';
  if (!Number.isFinite(fee) || fee < 0) errors.fee = 'Fee must be a number of 0 or more.';
  if (!Number.isFinite(qty) || qty <= 0) errors.quantity = 'Quantity must be a number greater than 0.';
  if (!symbol) errors.symbol = 'Symbol is required.';
  else if (!SYMBOL_RE.test(symbol)) errors.symbol = 'Symbol must be 1–12 characters: letters, digits, period, or hyphen.';
  if (!ACTIVITY_TYPES.includes(a.type)) errors.type = 'Type must be BUY, SELL, DIVIDEND, FEE, INTEREST, or LIABILITY.';
  if (!Number.isFinite(price) || price < 0) errors.unitPrice = 'Unit price must be a number of 0 or more.';
  if (comment.length > 200) errors.comment = 'Comment must be at most 200 characters.';
  // Cross-field
  if ((a.type === 'FEE' || a.type === 'INTEREST') && !errors.unitPrice && price !== 0) {
    errors.unitPrice = `Unit price must be 0 for a ${a.type} activity.`;
  }
  if (a.type === 'SELL' && !errors.quantity && !errors.symbol) {
    const holding = state.holdings.find((h) => h.symbol === symbol.toUpperCase());
    if (holding && qty > holding.quantity) {
      errors.quantity = `Quantity must not exceed the held ${holding.symbol} quantity of ${qtyText(holding.quantity)}.`;
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

// ---------------------------------------------------------------------------
// Domain commands (shared by UI + WebMCP)
// ---------------------------------------------------------------------------
function normalizeHolding(data) {
  return {
    id: data.id,
    name: String(data.name ?? '').trim(),
    symbol: String(data.symbol ?? '').trim().toUpperCase(),
    assetClass: data.assetClass,
    quantity: Number(data.quantity),
    unitPrice: Number(data.unitPrice),
    currency: data.currency,
    dataSource: data.dataSource
  };
}

function createHolding(data) {
  const holding = normalizeHolding(data);
  const v = validateHolding(holding);
  if (!v.ok) return { ok: false, errors: v.errors, error: Object.values(v.errors)[0] };
  pushUndo();
  holding.id = nextId('h');
  state.holdings.push(holding);
  state.selectedId = holding.id;
  state.editingId = null;
  state._enterId = holding.id;
  persist();
  render();
  announce(`Added holding ${holding.name}`);
  toast(`Added ${holding.name}`);
  return { ok: true, id: holding.id, netWorth: netWorth(state.holdings) };
}

function updateHolding(id, data) {
  const idx = state.holdings.findIndex((h) => h.id === id);
  if (idx === -1) return { ok: false, error: 'Holding not found' };
  const merged = normalizeHolding({ ...state.holdings[idx], ...data });
  const v = validateHolding(merged);
  if (!v.ok) return { ok: false, errors: v.errors, error: Object.values(v.errors)[0] };
  pushUndo();
  merged.id = id;
  state.holdings[idx] = merged;
  state.selectedId = id;
  persist();
  render();
  announce(`Updated holding ${merged.name}`);
  toast(`Updated ${merged.name}`);
  return { ok: true, id, netWorth: netWorth(state.holdings) };
}

function deleteHolding(id, confirm) {
  if (confirm !== true) return { ok: false, error: 'Delete requires confirm=true' };
  const holding = state.holdings.find((h) => h.id === id);
  if (!holding) return { ok: false, error: 'Holding not found' };
  pushUndo();
  state.holdings = state.holdings.filter((h) => h.id !== id);
  state.holdingSel.delete(id);
  if (state.selectedId === id) clearSelection();
  if (state.editingId === id) resetHoldingForm();
  persist();
  queueRowExit(holding);
  render();
  announce(`Removed holding ${holding.name}`);
  toast(`Removed ${holding.name}`);
  return { ok: true, id };
}

function selectHolding(id) {
  const holding = state.holdings.find((h) => h.id === id);
  if (!holding) return { ok: false, error: 'Holding not found' };
  state.selectedId = id;
  render();
  return { ok: true, id, name: holding.name };
}
function clearSelection() { state.selectedId = null; }

function applyFilter(value) {
  state.filter = value === 'all' || ASSET_CLASSES.includes(value) ? value : 'all';
  if (state.selectedId && !visibleHoldings().some((h) => h.id === state.selectedId)) clearSelection();
  render();
  return { filter: state.filter, visibleCount: visibleHoldings().length };
}
function clearFilter() { return applyFilter('all'); }
function applyActivityFilter(value) {
  state.activityFilter = value === 'all' || ACTIVITY_TYPES.includes(value) ? value : 'all';
  render();
  return { filter: state.activityFilter };
}
function applySort(col) {
  if (state.sort && state.sort.col === col) state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
  else state.sort = { col, dir: 'asc' };
  render();
  return { sort: state.sort };
}

// Activity create, with holding side-effects.
function createActivity(data) {
  const act = {
    id: nextId('a'),
    currency: data.currency,
    dataSource: data.dataSource,
    date: data.date,
    fee: Number(data.fee),
    quantity: Number(data.quantity),
    symbol: String(data.symbol ?? '').trim().toUpperCase(),
    type: data.type,
    unitPrice: Number(data.unitPrice),
    comment: String(data.comment ?? '')
  };
  const v = validateActivity(act);
  if (!v.ok) return { ok: false, errors: v.errors, error: Object.values(v.errors)[0] };
  pushUndo();
  state.activities.push(act);
  // Holding side-effects.
  if (act.type === 'BUY') {
    const h = state.holdings.find((x) => x.symbol === act.symbol);
    if (h) { h.quantity += act.quantity; }
    else {
      const nh = {
        id: nextId('h'), name: act.symbol, symbol: act.symbol, assetClass: 'Equity',
        quantity: act.quantity, unitPrice: act.unitPrice, currency: act.currency, dataSource: act.dataSource
      };
      state.holdings.push(nh);
      state._enterId = nh.id;
    }
  } else if (act.type === 'SELL') {
    const h = state.holdings.find((x) => x.symbol === act.symbol);
    if (h) {
      h.quantity -= act.quantity;
      if (h.quantity <= 1e-9) {
        state.holdings = state.holdings.filter((x) => x.id !== h.id);
        if (state.selectedId === h.id) clearSelection();
      }
    }
  }
  persist();
  render();
  announce(`Added ${act.type} activity for ${act.symbol}`);
  toast(`Saved ${act.type} ${act.symbol}`);
  return { ok: true, id: act.id };
}

// Batch selection.
function toggleHoldingSel(id, on) { if (on) state.holdingSel.add(id); else state.holdingSel.delete(id); render(); }
function toggleActivitySel(id, on) { if (on) state.activitySel.add(id); else state.activitySel.delete(id); render(); }
function selectAllHoldings(on) {
  state.holdingSel = new Set(on ? visibleHoldings().map((h) => h.id) : []);
  render();
}
function selectAllActivities(on) {
  state.activitySel = new Set(on ? visibleActivities().map((a) => a.id) : []);
  render();
}
function clearHoldingSel() { state.holdingSel.clear(); render(); }
function clearActivitySel() { state.activitySel.clear(); render(); }

function bulkDeleteHoldings() {
  if (!state.holdingSel.size) return { ok: false, error: 'No holdings selected' };
  pushUndo();
  const ids = new Set(state.holdingSel);
  const removed = state.holdings.filter((h) => ids.has(h.id));
  state.holdings = state.holdings.filter((h) => !ids.has(h.id));
  if (state.selectedId && ids.has(state.selectedId)) clearSelection();
  state.holdingSel.clear();
  persist();
  for (const h of removed) queueRowExit(h);
  render();
  announce(`Deleted ${ids.size} holdings`);
  toast(`Deleted ${ids.size} holdings`);
  return { ok: true, count: ids.size };
}
function bulkEditHoldings({ assetClass, dataSource }) {
  if (!state.holdingSel.size) return { ok: false, error: 'No holdings selected' };
  const ids = new Set(state.holdingSel);
  const targets = state.holdings.filter((h) => ids.has(h.id));
  const proposed = targets.map((h) => ({ ...h, ...(assetClass ? { assetClass } : {}), ...(dataSource ? { dataSource } : {}) }));
  for (const p of proposed) {
    const v = validateHolding(p);
    if (!v.ok) {
      const msg = Object.values(v.errors)[0];
      toast(`Bulk edit blocked for ${p.symbol}: ${msg}`);
      announce(`Bulk edit blocked for ${p.symbol}`);
      return { ok: false, error: msg };
    }
  }
  pushUndo();
  for (const h of targets) {
    if (assetClass) h.assetClass = assetClass;
    if (dataSource) h.dataSource = dataSource;
  }
  state.holdingSel.clear();
  persist();
  render();
  announce(`Bulk edited ${targets.length} holdings`);
  toast(`Bulk edited ${targets.length} holdings`);
  return { ok: true, count: targets.length };
}
function bulkDeleteActivities() {
  if (!state.activitySel.size) return { ok: false, error: 'No activities selected' };
  pushUndo();
  const ids = new Set(state.activitySel);
  const toDelete = state.activities.filter((a) => ids.has(a.id));
  state.activities = state.activities.filter((a) => !ids.has(a.id));
  reverseActivityHoldingEffects(toDelete);
  state.activitySel.clear();
  persist();
  render();
  announce(`Deleted ${ids.size} activities`);
  toast(`Deleted ${ids.size} activities`);
  return { ok: true, count: ids.size };
}

// Undo the holding quantity side-effects createActivity applied for BUY/SELL
// activities, so deleting activities keeps holdings in sync with the ledger.
// Deltas are netted per symbol so the outcome is independent of deletion order.
function reverseActivityHoldingEffects(activities) {
  const deltas = new Map();
  for (const act of activities) {
    const sign = act.type === 'BUY' ? -1 : act.type === 'SELL' ? 1 : 0;
    if (!sign) continue;
    const entry = deltas.get(act.symbol) || { qty: 0, sample: act };
    entry.qty += sign * act.quantity;
    deltas.set(act.symbol, entry);
  }
  for (const [symbol, { qty, sample }] of deltas) {
    if (!qty) continue;
    const h = state.holdings.find((x) => x.symbol === symbol);
    if (h) {
      h.quantity += qty;
      if (h.quantity <= 1e-9) {
        state.holdings = state.holdings.filter((x) => x.id !== h.id);
        if (state.selectedId === h.id) clearSelection();
      }
    } else if (qty > 0) {
      const nh = {
        id: nextId('h'), name: symbol, symbol, assetClass: 'Equity',
        quantity: qty, unitPrice: sample.unitPrice, currency: sample.currency, dataSource: sample.dataSource
      };
      state.holdings.push(nh);
    }
  }
}
function bulkEditActivities({ dataSource }) {
  if (!state.activitySel.size) return { ok: false, error: 'No activities selected' };
  if (!dataSource) return { ok: false, error: 'Choose a data source' };
  pushUndo();
  const ids = new Set(state.activitySel);
  for (const a of state.activities) if (ids.has(a.id)) a.dataSource = dataSource;
  const count = ids.size;
  state.activitySel.clear();
  persist();
  render();
  announce(`Bulk edited ${count} activities`);
  toast(`Bulk edited ${count} activities`);
  return { ok: true, count };
}

// ---------------------------------------------------------------------------
// Export builders (compiled live from the store)
// ---------------------------------------------------------------------------
function holdingPayloads() {
  return state.holdings.map((h) => ({
    name: h.name, symbol: h.symbol, assetClass: h.assetClass, quantity: h.quantity,
    unitPrice: h.unitPrice, currency: h.currency, dataSource: h.dataSource, marketValue: marketValueOf(h)
  }));
}
function activityPayloads() {
  return state.activities.map((a) => ({
    currency: a.currency, dataSource: a.dataSource, date: a.date, fee: a.fee, quantity: a.quantity,
    symbol: a.symbol, type: a.type, unitPrice: a.unitPrice, comment: a.comment || ''
  }));
}
function portfolioJson() {
  return JSON.stringify({
    meta: { exportedAt: new Date().toISOString(), holdingCount: state.holdings.length, activityCount: state.activities.length },
    holdings: holdingPayloads(),
    activities: activityPayloads()
  }, null, 2);
}
function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function holdingsCsv() {
  const header = 'name,symbol,assetClass,quantity,unitPrice,currency,dataSource,marketValue';
  const rows = holdingPayloads().map((h) => [h.name, h.symbol, h.assetClass, h.quantity, h.unitPrice, h.currency, h.dataSource, h.marketValue].map(csvCell).join(','));
  return [header, ...rows].join('\n');
}
function activitiesCsv() {
  const header = 'currency,dataSource,date,fee,quantity,symbol,type,unitPrice,comment';
  const rows = activityPayloads().map((a) => [a.currency, a.dataSource, a.date, a.fee, a.quantity, a.symbol, a.type, a.unitPrice, a.comment].map(csvCell).join(','));
  return [header, ...rows].join('\n');
}
function performanceReport() {
  const perf = perfSummary();
  return JSON.stringify({
    meta: { exportedAt: new Date().toISOString(), holdingCount: state.holdings.length, activityCount: state.activities.length },
    performance: {
      netWorth: round2(perf.netWorth), totalCostBasis: round2(perf.totalCostBasis), realizedGain: round2(perf.realizedGain),
      unrealizedGain: round2(perf.unrealizedGain), dividendIncome: round2(perf.dividendIncome), totalFees: round2(perf.totalFees),
      totalReturn: round2(perf.totalReturn)
    },
    holdings: state.holdings.map((h) => {
      const m = holdingMetrics(h);
      return { symbol: h.symbol, quantity: h.quantity, averageUnitCost: round2(m.avgUnitCost), costBasis: round2(m.costBasis), marketValue: round2(m.marketValue), unrealizedGain: round2(m.unrealized) };
    }),
    series: seriesData()
  }, null, 2);
}
const round2 = (n) => Math.round(n * 100) / 100;
function currentExportText() {
  if (state.drawerTab === 'json') return portfolioJson();
  if (state.drawerTab === 'holdings-csv') return holdingsCsv();
  if (state.drawerTab === 'activities-csv') return activitiesCsv();
  return performanceReport();
}
function currentExportFilename() {
  return {
    json: 'portfolio.json', 'holdings-csv': 'holdings.csv', 'activities-csv': 'activities.csv', performance: 'performance-report.json'
  }[state.drawerTab];
}

// ---------------------------------------------------------------------------
// CSV parsing + import
// ---------------------------------------------------------------------------
function parseCsv(text) {
  const rows = [];
  let field = ''; let row = []; let inQuotes = false;
  const src = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 1; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length && !(r.length === 1 && r[0].trim() === ''));
}

function importPortfolioJson(text) {
  let doc;
  try { doc = JSON.parse(text); } catch (_) { return { ok: false, error: 'Portfolio JSON is not valid JSON.' }; }
  if (!doc || typeof doc !== 'object') return { ok: false, error: 'Portfolio JSON must be an object.' };
  if (!Array.isArray(doc.holdings)) return { ok: false, error: 'Portfolio JSON field holdings must be an array.' };
  if (!Array.isArray(doc.activities)) return { ok: false, error: 'Portfolio JSON field activities must be an array.' };
  const newHoldings = [];
  for (let i = 0; i < doc.holdings.length; i += 1) {
    const h = normalizeHolding({ ...doc.holdings[i] });
    const v = validateHolding(h);
    if (!v.ok) return { ok: false, error: `Portfolio JSON holdings[${i}].${Object.keys(v.errors)[0]}: ${Object.values(v.errors)[0]}` };
    h.id = nextId('h'); newHoldings.push(h);
  }
  const newActivities = [];
  for (let i = 0; i < doc.activities.length; i += 1) {
    const a = coerceActivity({ ...doc.activities[i], id: undefined });
    const v = validateActivity(a);
    if (!v.ok) return { ok: false, error: `Portfolio JSON activities[${i}].${Object.keys(v.errors)[0]}: ${Object.values(v.errors)[0]}` };
    newActivities.push(a);
  }
  pushUndo();
  state.holdings = newHoldings;
  state.activities = newActivities;
  clearSelection();
  resetHoldingForm();
  state.holdingSel.clear(); state.activitySel.clear();
  persist();
  render();
  announce('Imported portfolio JSON');
  toast('Imported Portfolio JSON');
  return { ok: true };
}

function importHoldingsCsv(text) {
  const rows = parseCsv(text);
  if (!rows.length) return { ok: false, error: 'Holdings CSV is empty.' };
  const header = rows[0].map((c) => c.trim());
  const need = ['name', 'symbol', 'assetClass', 'quantity', 'unitPrice', 'currency', 'dataSource'];
  for (const f of need) if (!header.includes(f)) return { ok: false, error: `Holdings CSV is missing the ${f} column.` };
  const idx = (f) => header.indexOf(f);
  const newHoldings = [];
  for (let r = 1; r < rows.length; r += 1) {
    const cells = rows[r];
    const h = normalizeHolding({
      name: cells[idx('name')], symbol: cells[idx('symbol')], assetClass: cells[idx('assetClass')],
      quantity: cells[idx('quantity')], unitPrice: cells[idx('unitPrice')], currency: cells[idx('currency')], dataSource: cells[idx('dataSource')]
    });
    const v = validateHolding(h);
    if (!v.ok) return { ok: false, error: `Holdings CSV row ${r} field ${Object.keys(v.errors)[0]}: ${Object.values(v.errors)[0]}` };
    h.id = nextId('h'); newHoldings.push(h);
  }
  pushUndo();
  state.holdings = newHoldings;
  clearSelection(); resetHoldingForm(); state.holdingSel.clear();
  persist();
  render();
  announce('Imported holdings CSV');
  toast('Imported Holdings CSV');
  return { ok: true };
}

const ACTIVITY_FIELDS = ['currency', 'dataSource', 'date', 'fee', 'quantity', 'symbol', 'type', 'unitPrice', 'comment'];
function beginActivitiesImport(text) {
  const rows = parseCsv(text);
  if (rows.length < 1) { showImportError('Activities CSV is empty.'); return { ok: false, error: 'empty' }; }
  const header = rows[0].map((c) => c.trim());
  // Auto-map columns by name.
  const mapping = {};
  for (const f of ACTIVITY_FIELDS) {
    const found = header.findIndex((h) => h.toLowerCase() === f.toLowerCase());
    mapping[f] = found;
  }
  const dataRows = rows.slice(1).map((cells, i) => ({ id: `r${i}`, cells, excluded: false }));
  state.diag = { header, mapping, rows: dataRows, committedSummary: '' };
  openDiag();
  return { ok: true };
}
function diagRowValues(row) {
  const vals = {};
  for (const f of ACTIVITY_FIELDS) {
    const col = state.diag.mapping[f];
    vals[f] = col >= 0 ? (row.cells[col] ?? '') : '';
  }
  return vals;
}
function diagRowToActivity(vals) {
  let date = String(vals.date || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) date = `${date}T00:00:00.000Z`;
  return coerceActivity({
    currency: (vals.currency || '').trim().toUpperCase(),
    dataSource: (vals.dataSource || '').trim().toUpperCase(),
    date, fee: vals.fee, quantity: vals.quantity,
    symbol: (vals.symbol || '').trim().toUpperCase(),
    type: (vals.type || '').trim().toUpperCase(), unitPrice: vals.unitPrice, comment: vals.comment
  });
}
function diagValidateRow(row) {
  const vals = diagRowValues(row);
  const act = diagRowToActivity(vals);
  const v = validateActivity(act);
  return { vals, act, ...v };
}
function commitDiag() {
  if (!state.diag) return { ok: false };
  const valid = [];
  let skipped = 0;
  for (const row of state.diag.rows) {
    if (row.excluded) { skipped += 1; continue; }
    const r = diagValidateRow(row);
    if (r.ok) valid.push(r.act); else skipped += 1;
  }
  if (valid.length > 0) {
    pushUndo();
    for (const a of valid) { a.id = nextId('a'); state.activities.push(a); }
    persist();
  }
  const summary = `Imported ${numberInWords(valid.length)} ${valid.length === 1 ? 'row' : 'rows'}; skipped ${numberInWords(skipped)} ${skipped === 1 ? 'row' : 'rows'}.`;
  closeDiag();
  render();
  announce(summary);
  toast(summary);
  return { ok: true, imported: valid.length, skipped };
}
function cancelDiag() {
  closeDiag();
  render();
  toast('Import cancelled; nothing changed.');
  return { ok: true };
}
function numberInWords(n) {
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  return n <= 12 ? `${words[n]} (${n})` : String(n);
}

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------
const el = (id) => document.getElementById(id);
const refs = {};
const HFIELDS = ['name', 'symbol', 'class', 'qty', 'price', 'currency', 'source'];
const AFIELDS = ['type', 'symbol', 'qty', 'price', 'fee', 'currency', 'source', 'date', 'comment'];
const holdingTouched = {};
const activityTouched = {};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
let lastNetWorth = 0;
const perfShown = {};

// Holdings mid-exit-animation, kept around just long enough to render their
// outgoing row; already removed from state.holdings so they play no part in
// totals/allocation/exports.
let exitingRows = [];
function queueRowExit(holding) {
  if (prefersReducedMotion()) return;
  exitingRows.push(holding);
  setTimeout(() => {
    exitingRows = exitingRows.filter((h) => h.id !== holding.id);
    render();
  }, 320);
}

function render() {
  const list = visibleHoldings();
  const total = netWorth(list);
  const classCount = new Set(list.map((h) => h.assetClass)).size;
  tweenNumber(refs.netWorth, lastNetWorth, total, (v) => money(v));
  lastNetWorth = total;
  refs.meta.textContent = `${list.length} holding${list.length === 1 ? '' : 's'} visible · ${classCount} class${classCount === 1 ? '' : 'es'} visible`;

  renderAllocation(list);
  renderPerformance();
  renderChart();
  renderTable(list);
  renderDetail();
  renderActivities();
  renderHoldingTray();
  renderActivityTray();
  syncControls();
  updateHoldingFormValidity();
  updateActivityFormValidity();
  refs.undoBtn.disabled = undoStack.length === 0;
  if (refs.drawer && !refs.drawer.hidden) renderExport();
}

function renderAllocation(list) {
  const rows = allocationRows(list);
  refs.allocation.innerHTML = '';
  if (!rows.length) {
    const li = document.createElement('li');
    li.className = 'allocation-row';
    li.innerHTML = '<span class="allocation-name">No classes</span>';
    refs.allocation.appendChild(li);
    return;
  }
  for (const row of rows) {
    const li = document.createElement('li');
    li.className = 'allocation-row';
    li.innerHTML =
      `<span class="allocation-name">${escapeHtml(row.name)}</span>` +
      `<span class="allocation-bar"><span class="allocation-fill" style="width:${row.pct}%"></span></span>` +
      `<span class="allocation-pct num">${row.pct}%</span>`;
    refs.allocation.appendChild(li);
  }
}

const PERF_FIELDS = [
  ['Net worth', 'netWorth', false], ['Total cost basis', 'totalCostBasis', false],
  ['Realized gain', 'realizedGain', true], ['Unrealized gain', 'unrealizedGain', true],
  ['Dividend income', 'dividendIncome', true], ['Total fees', 'totalFees', false],
  ['Total return', 'totalReturn', true]
];
let lastPerf = null;

function renderPerformance() {
  const p = perfSummary();
  // Build the figure nodes once, then tween each value in place on later renders
  // (mirroring the net-worth tween) instead of rebuilding innerHTML, which snapped.
  if (!refs.perfFigures.children.length) {
    for (const [label] of PERF_FIELDS) {
      const div = document.createElement('div');
      div.className = 'perf-fig';
      div.innerHTML = `<div class="perf-label">${escapeHtml(label)}</div><div class="perf-val num"></div>`;
      refs.perfFigures.appendChild(div);
    }
  }
  const nodes = refs.perfFigures.children;
  PERF_FIELDS.forEach(([, key, gainLike], i) => {
    const val = p[key];
    const from = lastPerf ? lastPerf[key] : 0;
    const valNode = nodes[i].querySelector('.perf-val');
    const cls = gainLike ? (val >= 0 ? 'pos' : 'neg') : '';
    valNode.className = `perf-val ${cls} num`;
    tweenNumber(valNode, from, val, (v) => (gainLike ? signedMoney(v) : money(v)));
  });
  lastPerf = p;
}

function renderChart() {
  const series = seriesData();
  const wrap = refs.chartWrap;
  const W = 720; const H = 220; const pad = { l: 56, r: 16, t: 14, b: 30 };
  const iw = W - pad.l - pad.r; const ih = H - pad.t - pad.b;
  const bench = series.map((s) => benchAt(s.date));
  const flatBench = benchAt(new Date().toISOString().slice(0, 10));
  let maxV = 1;
  for (const s of series) maxV = Math.max(maxV, s.value);
  if (state.benchmarkOn) {
    for (const b of bench) maxV = Math.max(maxV, b);
    if (!series.length) maxV = Math.max(maxV, flatBench);
  }
  const n = series.length;
  const xAt = (i) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const yAt = (v) => pad.t + ih - (v / maxV) * ih;
  const line = (vals) => vals.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');
  const grid = [];
  for (let g = 0; g <= 4; g += 1) {
    const y = pad.t + (g / 4) * ih;
    const val = maxV * (1 - g / 4);
    grid.push(`<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="#e3eae7" stroke-width="1"/>`);
    grid.push(`<text x="${pad.l - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#475b54">${money(val)}</text>`);
  }
  const xticks = [];
  if (n) {
    const step = Math.max(1, Math.ceil(n / 4));
    for (let i = 0; i < n; i += step) {
      xticks.push(`<text x="${xAt(i)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="#475b54">${series[i].date.slice(0, 7)}</text>`);
    }
  }
  let paths = '';
  if (n >= 1) {
    if (state.benchmarkOn) {
      paths += `<polyline class="bench-line" fill="none" stroke="#c026d3" stroke-width="2" stroke-dasharray="5 4" points="${line(bench)}"/>`;
    }
    paths += `<polyline class="portfolio-line" fill="none" stroke="#0f766e" stroke-width="2.5" points="${line(series.map((s) => s.value))}"/>`;
  } else if (state.benchmarkOn) {
    // Empty ledger: the portfolio series is empty, but the seeded benchmark still overlays.
    const y = yAt(flatBench);
    paths += `<polyline class="bench-line" fill="none" stroke="#c026d3" stroke-width="2" stroke-dasharray="5 4" points="${pad.l},${y} ${W - pad.r},${y}"/>`;
  }
  const empty = n === 0 ? `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="13" fill="#475b54">No activity data yet</text>` : '';
  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Portfolio value over time">${grid.join('')}${xticks.join('')}${paths}${empty}</svg>`;
  refs.chartLegend.hidden = !state.benchmarkOn;
  refs.chartLegend.innerHTML = state.benchmarkOn
    ? '<span class="legend-item"><span class="legend-swatch" style="background:#0f766e"></span>Portfolio</span>' +
      '<span class="legend-item"><span class="legend-swatch" style="background:#c026d3"></span>Benchmark</span>'
    : '';
}

function renderTable(list) {
  refs.body.innerHTML = '';
  refs.emptyState.hidden = list.length > 0 || exitingRows.length > 0;
  for (const h of list) {
    const tr = document.createElement('tr');
    tr.dataset.id = h.id;
    tr.tabIndex = 0;
    tr.setAttribute('role', 'row');
    tr.setAttribute('aria-selected', String(h.id === state.selectedId));
    if (h.id === state.selectedId) tr.classList.add('selected');
    if (state._enterId === h.id && !prefersReducedMotion()) tr.classList.add('row-enter');
    const checked = state.holdingSel.has(h.id) ? 'checked' : '';
    const displayName = h.name.length > 40 ? `${escapeHtml(h.name.slice(0, 40))}…` : escapeHtml(h.name);
    tr.innerHTML =
      `<td class="col-check"><input type="checkbox" class="row-check" data-id="${h.id}" ${checked} aria-label="Select ${escapeHtml(h.name)}" /></td>` +
      `<td class="cell-name" title="${escapeHtml(h.name)}">${displayName}</td>` +
      `<td class="cell-symbol">${escapeHtml(h.symbol)}</td>` +
      `<td>${escapeHtml(h.assetClass)}</td>` +
      `<td class="num">${qtyText(h.quantity)}</td>` +
      `<td>${escapeHtml(h.currency)}</td>` +
      `<td class="num">${money(marketValueOf(h))}</td>`;
    refs.body.appendChild(tr);
  }
  state._enterId = null;
  // Rows just removed from state.holdings still get one exit-animation pass so
  // deletes read as an animated removal instead of vanishing instantly.
  for (const h of exitingRows) {
    const tr = document.createElement('tr');
    tr.className = 'row-exit';
    tr.setAttribute('aria-hidden', 'true');
    const displayName = h.name.length > 40 ? `${escapeHtml(h.name.slice(0, 40))}…` : escapeHtml(h.name);
    tr.innerHTML =
      `<td class="col-check"></td>` +
      `<td class="cell-name" title="${escapeHtml(h.name)}">${displayName}</td>` +
      `<td class="cell-symbol">${escapeHtml(h.symbol)}</td>` +
      `<td>${escapeHtml(h.assetClass)}</td>` +
      `<td class="num">${qtyText(h.quantity)}</td>` +
      `<td>${escapeHtml(h.currency)}</td>` +
      `<td class="num">${money(marketValueOf(h))}</td>`;
    refs.body.appendChild(tr);
  }
  // sort indicators
  for (const btn of refs.sortBtns) {
    const ind = btn.querySelector('.sort-ind');
    if (state.sort && state.sort.col === btn.dataset.sort) {
      ind.textContent = state.sort.dir === 'asc' ? '▲' : '▼';
      btn.setAttribute('aria-sort', state.sort.dir === 'asc' ? 'ascending' : 'descending');
    } else { ind.textContent = ''; btn.removeAttribute('aria-sort'); }
  }
  const allVis = visibleHoldings();
  refs.holdingsSelectAll.checked = allVis.length > 0 && allVis.every((h) => state.holdingSel.has(h.id));
}

function renderDetail() {
  const h = state.holdings.find((x) => x.id === state.selectedId);
  if (!h) {
    refs.detailName.textContent = 'No holding selected';
    refs.detailList.hidden = true; refs.detailEmpty.hidden = false; refs.detailActions.hidden = true;
    return;
  }
  const m = holdingMetrics(h);
  refs.detailName.textContent = h.name;
  refs.dSymbol.textContent = h.symbol;
  refs.dClass.textContent = h.assetClass;
  refs.dQty.textContent = qtyText(h.quantity);
  refs.dPrice.textContent = priceText(h.unitPrice);
  refs.dCurrency.textContent = h.currency;
  refs.dSource.textContent = h.dataSource;
  refs.dValue.textContent = money(m.marketValue);
  refs.dAvgCost.textContent = priceText(m.avgUnitCost);
  refs.dCostBasis.textContent = money(m.costBasis);
  refs.dUnrealized.textContent = signedMoney(m.unrealized);
  refs.dUnrealized.className = `num ${m.unrealized >= 0 ? 'dd-pos' : 'dd-neg'}`;
  refs.dRealized.textContent = signedMoney(m.realized);
  refs.dRealized.className = `num ${m.realized >= 0 ? 'dd-pos' : 'dd-neg'}`;
  refs.detailList.hidden = false; refs.detailEmpty.hidden = true; refs.detailActions.hidden = false;
}

function renderActivities() {
  const list = visibleActivities();
  refs.activitiesBody.innerHTML = '';
  refs.ledgerEmpty.hidden = list.length > 0;
  for (const a of list) {
    const tr = document.createElement('tr');
    tr.dataset.id = a.id;
    const checked = state.activitySel.has(a.id) ? 'checked' : '';
    tr.innerHTML =
      `<td class="col-check"><input type="checkbox" class="act-check" data-id="${a.id}" ${checked} aria-label="Select activity ${escapeHtml(a.symbol)} ${a.type}" /></td>` +
      `<td>${escapeHtml(a.date.slice(0, 10))}</td>` +
      `<td>${escapeHtml(a.type)}</td>` +
      `<td>${escapeHtml(a.symbol)}</td>` +
      `<td class="num">${qtyText(a.quantity)}</td>` +
      `<td class="num">${priceText(a.unitPrice)}</td>` +
      `<td class="num">${priceText(a.fee)}</td>` +
      `<td>${escapeHtml(a.currency)}</td>`;
    refs.activitiesBody.appendChild(tr);
  }
  refs.activitiesSelectAll.checked = list.length > 0 && list.every((a) => state.activitySel.has(a.id));
}

function renderHoldingTray() {
  const count = state.holdingSel.size;
  const wasHidden = refs.holdingsTray.hidden;
  refs.holdingsTray.hidden = count === 0;
  if (count > 0) {
    refs.holdingsTrayCount.textContent = `${count} holding${count === 1 ? '' : 's'} selected`;
    if (wasHidden && !prefersReducedMotion()) {
      refs.holdingsTray.classList.remove('tray-enter'); void refs.holdingsTray.offsetWidth; refs.holdingsTray.classList.add('tray-enter');
    }
  }
}
function renderActivityTray() {
  const count = state.activitySel.size;
  const wasHidden = refs.activitiesTray.hidden;
  refs.activitiesTray.hidden = count === 0;
  if (count > 0) {
    refs.activitiesTrayCount.textContent = `${count} activit${count === 1 ? 'y' : 'ies'} selected`;
    if (wasHidden && !prefersReducedMotion()) {
      refs.activitiesTray.classList.remove('tray-enter'); void refs.activitiesTray.offsetWidth; refs.activitiesTray.classList.add('tray-enter');
    }
  }
}

function syncControls() {
  if (refs.filter.value !== state.filter) refs.filter.value = state.filter;
  if (refs.activityFilterSel.value !== state.activityFilter) refs.activityFilterSel.value = state.activityFilter;
  refs.benchmarkToggle.checked = state.benchmarkOn;
  refs.benchmarkToggle.setAttribute('aria-checked', String(state.benchmarkOn));
}

// number tween
function tweenNumber(node, from, to, fmt) {
  if (prefersReducedMotion() || from === to) { node.textContent = fmt(to); return; }
  const start = performance.now();
  const dur = 400;
  function step(now) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = fmt(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function announce(msg) { refs.live.textContent = msg; }
let toastSeq = 0;
function toast(msg) {
  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = msg;
  refs.toastContainer.appendChild(div);
  const id = ++toastSeq;
  div.dataset.id = id;
  setTimeout(() => {
    div.classList.add('toast-out');
    setTimeout(() => div.remove(), 320);
  }, 2200);
}

// ---------------------------------------------------------------------------
// Holding form
// ---------------------------------------------------------------------------
function readHoldingForm() {
  return {
    name: refs.fName.value, symbol: refs.fSymbol.value, assetClass: refs.fClass.value,
    quantity: refs.fQty.value, unitPrice: refs.fPrice.value, currency: refs.fCurrency.value, dataSource: refs.fSource.value
  };
}
function updateHoldingFormValidity() {
  const data = normalizeHolding(readHoldingForm());
  const v = validateHolding(data);
  refs.saveHoldingBtn.disabled = !v.ok;
  const mv = (Number(data.quantity) > 0 && Number(data.unitPrice) >= 0) ? Number(data.quantity) * Number(data.unitPrice) : 0;
  refs.fMarket.textContent = money(mv);
  const map = { name: 'name', symbol: 'symbol', class: 'assetClass', qty: 'quantity', price: 'unitPrice', currency: 'currency', source: 'dataSource' };
  for (const key of HFIELDS) {
    const errEl = refs[`eH_${key}`];
    const field = map[key];
    if (holdingTouched[key] && v.errors[field]) { errEl.textContent = v.errors[field]; errEl.hidden = false; }
    else { errEl.textContent = ''; errEl.hidden = true; }
  }
}
function loadHoldingIntoForm(h) {
  state.editingId = h.id;
  refs.fName.value = h.name; refs.fSymbol.value = h.symbol; refs.fClass.value = h.assetClass;
  refs.fQty.value = String(h.quantity); refs.fPrice.value = String(Number(h.unitPrice.toFixed(6)));
  refs.fCurrency.value = h.currency; refs.fSource.value = h.dataSource;
  refs.saveHoldingBtn.textContent = 'Save holding';
  for (const k of HFIELDS) holdingTouched[k] = false;
  hideFormError(refs.formError);
  updateHoldingFormValidity();
}
function resetHoldingForm() {
  state.editingId = null;
  refs.holdingForm.reset();
  refs.fClass.value = 'Equity'; refs.fCurrency.value = 'USD'; refs.fSource.value = 'MANUAL';
  refs.saveHoldingBtn.textContent = 'Save holding';
  for (const k of HFIELDS) holdingTouched[k] = false;
  hideFormError(refs.formError);
  updateHoldingFormValidity();
}
function submitHoldingForm(e) {
  e.preventDefault();
  for (const k of HFIELDS) holdingTouched[k] = true;
  const data = readHoldingForm();
  const result = state.editingId ? updateHolding(state.editingId, data) : createHolding(data);
  if (!result.ok) { showFormError(refs.formError, result.error); updateHoldingFormValidity(); return; }
  hideFormError(refs.formError);
  resetHoldingForm();
}

// ---------------------------------------------------------------------------
// Activity form
// ---------------------------------------------------------------------------
function readActivityForm() {
  let date = refs.aDate.value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) date = `${date}T00:00:00.000Z`;
  return {
    type: refs.aType.value, symbol: refs.aSymbol.value, quantity: refs.aQty.value, unitPrice: refs.aPrice.value,
    fee: refs.aFee.value, currency: refs.aCurrency.value, dataSource: refs.aSource.value, date, comment: refs.aComment.value
  };
}
function updateActivityFormValidity() {
  if (refs.activityForm.hidden) { refs.saveActivityBtn.disabled = true; return; }
  const data = readActivityForm();
  const act = coerceActivity(data);
  const v = validateActivity(act);
  refs.saveActivityBtn.disabled = !v.ok;
  const map = { type: 'type', symbol: 'symbol', qty: 'quantity', price: 'unitPrice', fee: 'fee', currency: 'currency', source: 'dataSource', date: 'date', comment: 'comment' };
  for (const key of AFIELDS) {
    const errEl = refs[`eA_${key}`];
    const field = map[key];
    if (activityTouched[key] && v.errors[field]) { errEl.textContent = v.errors[field]; errEl.hidden = false; }
    else { errEl.textContent = ''; errEl.hidden = true; }
  }
}
function openActivityForm() {
  refs.activityForm.hidden = false;
  refs.activityForm.reset();
  refs.aType.value = 'BUY'; refs.aCurrency.value = 'USD'; refs.aSource.value = 'MANUAL';
  refs.aDate.value = new Date().toISOString().slice(0, 10);
  refs.aFee.value = '0';
  for (const k of AFIELDS) activityTouched[k] = false;
  hideFormError(refs.activityError);
  updateActivityFormValidity();
  refs.aSymbol.focus();
}
function closeActivityForm() { refs.activityForm.hidden = true; updateActivityFormValidity(); }
function submitActivityForm(e) {
  e.preventDefault();
  for (const k of AFIELDS) activityTouched[k] = true;
  const result = createActivity(readActivityForm());
  if (!result.ok) { showFormError(refs.activityError, result.error); updateActivityFormValidity(); return; }
  hideFormError(refs.activityError);
  closeActivityForm();
}

function showFormError(node, msg) { node.textContent = msg; node.hidden = false; }
function hideFormError(node) { node.textContent = ''; node.hidden = true; }

// ---------------------------------------------------------------------------
// Export drawer
// ---------------------------------------------------------------------------
let drawerOpener = null;
function openDrawer() {
  drawerOpener = document.activeElement;
  refs.drawer.hidden = false; refs.drawerOverlay.hidden = false;
  renderExport();
  refs.drawerClose.focus();
  document.addEventListener('keydown', drawerKeydown);
  return { ok: true };
}
function closeDrawer() {
  refs.drawer.hidden = true; refs.drawerOverlay.hidden = true;
  document.removeEventListener('keydown', drawerKeydown);
  if (drawerOpener && drawerOpener.focus) drawerOpener.focus();
  return { ok: true };
}
function drawerKeydown(e) {
  if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
  if (e.key === 'Tab') {
    const focusables = refs.drawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const visible = [...focusables].filter((n) => !n.hidden && n.offsetParent !== null);
    if (!visible.length) return;
    const first = visible[0]; const last = visible[visible.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}
function setDrawerTab(tab) { state.drawerTab = tab; renderExport(); }
function renderExport() {
  for (const t of refs.drawerTabs) t.classList.toggle('active', t.dataset.tab === state.drawerTab);
  for (const t of refs.drawerTabs) t.setAttribute('aria-selected', String(t.dataset.tab === state.drawerTab));
  refs.exportPreview.textContent = currentExportText();
  const p = perfSummary();
  refs.exportSummary.innerHTML =
    `<div class="es-item"><span class="es-label">Holdings</span><span class="es-val num">${state.holdings.length}</span></div>` +
    `<div class="es-item"><span class="es-label">Activities</span><span class="es-val num">${state.activities.length}</span></div>` +
    `<div class="es-item"><span class="es-label">Net worth</span><span class="es-val num">${money(p.netWorth)}</span></div>`;
}
async function copyExport() {
  const text = currentExportText();
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(text);
    else fallbackCopy(text);
  } catch (_) { fallbackCopy(text); }
  refs.copyConfirm.hidden = false;
  setTimeout(() => { refs.copyConfirm.hidden = true; }, 1800);
  return { ok: true, format: state.drawerTab };
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch (_) { /* ignore */ }
  ta.remove();
}
function downloadExport() {
  const text = currentExportText();
  const isJson = state.drawerTab === 'json' || state.drawerTab === 'performance';
  const blob = new Blob([text], { type: isJson ? 'application/json' : 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = currentExportFilename();
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { ok: true, format: state.drawerTab };
}
function showImportError(msg) { refs.importError.textContent = msg; refs.importError.hidden = false; }
function hideImportError() { refs.importError.textContent = ''; refs.importError.hidden = true; }

function handleImportFile(file) {
  hideImportError();
  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result || '');
    const name = (file.name || '').toLowerCase();
    let result;
    if (name.endsWith('.json') || /^\s*[{[]/.test(text)) result = importPortfolioJson(text);
    else {
      const header = (parseCsv(text)[0] || []).map((c) => c.trim().toLowerCase());
      if (header.includes('type') && header.includes('date')) { beginActivitiesImport(text); return; }
      result = importHoldingsCsv(text);
    }
    if (result && !result.ok) showImportError(`Import error — ${result.error}`);
    else if (result && result.ok) closeDrawer();
  };
  reader.onerror = () => showImportError('Import error — could not read the file.');
  reader.readAsText(file);
}

// ---------------------------------------------------------------------------
// Import diagnostics screen
// ---------------------------------------------------------------------------
let diagOpener = null;
function openDiag() {
  diagOpener = document.activeElement;
  refs.diagScreen.hidden = false; refs.diagOverlay.hidden = false;
  renderDiag();
  refs.diagCommit.focus();
  document.addEventListener('keydown', diagKeydown);
}
function closeDiag() {
  state.diag = null;
  refs.diagScreen.hidden = true; refs.diagOverlay.hidden = true;
  document.removeEventListener('keydown', diagKeydown);
  if (diagOpener && diagOpener.focus) diagOpener.focus();
}
function diagKeydown(e) { if (e.key === 'Escape') { e.preventDefault(); cancelDiag(); } }
function renderDiag() {
  if (!state.diag) return;
  const d = state.diag;
  // mapping controls
  refs.diagMappingGrid.innerHTML = '';
  for (const f of ACTIVITY_FIELDS) {
    const cell = document.createElement('div');
    cell.className = 'mapping-cell';
    const opts = ['<option value="-1">— unmapped —</option>']
      .concat(d.header.map((h, i) => `<option value="${i}" ${d.mapping[f] === i ? 'selected' : ''}>${escapeHtml(h)}</option>`));
    cell.innerHTML = `<label for="map-${f}">${f}</label><select id="map-${f}" class="input input-sm" data-field="${f}">${opts.join('')}</select>`;
    refs.diagMappingGrid.appendChild(cell);
  }
  // rows
  let validCount = 0; let excluded = 0;
  refs.diagThead.innerHTML = `<tr><th>Status</th>${ACTIVITY_FIELDS.map((f) => `<th>${f}</th>`).join('')}<th>Include</th></tr>`;
  refs.diagBody.innerHTML = '';
  d.rows.forEach((row, ri) => {
    const r = diagValidateRow(row);
    if (row.excluded) excluded += 1; else if (r.ok) validCount += 1;
    const tr = document.createElement('tr');
    tr.className = row.excluded ? 'diag-row-excluded' : (r.ok ? '' : 'diag-row-invalid');
    let cells = `<td><span class="diag-badge ${r.ok ? 'ok' : 'bad'}">${r.ok ? 'Valid' : 'Invalid'}</span></td>`;
    for (const f of ACTIVITY_FIELDS) {
      const col = d.mapping[f];
      const val = col >= 0 ? (row.cells[col] ?? '') : '';
      const bad = !r.ok && r.errors[f];
      cells += `<td><input data-row="${ri}" data-field="${f}" value="${escapeHtml(val)}" aria-label="${f} for row ${ri + 1}" />${bad ? `<span class="diag-fieldmsg">${escapeHtml(r.errors[f])}</span>` : ''}</td>`;
    }
    cells += `<td><input type="checkbox" data-exclude="${ri}" ${row.excluded ? '' : 'checked'} aria-label="Include row ${ri + 1}" /></td>`;
    tr.innerHTML = cells;
    refs.diagBody.appendChild(tr);
  });
  refs.diagSummary.textContent = `${numberInWords(validCount)} valid, ${numberInWords(d.rows.length - excluded - validCount)} invalid, ${numberInWords(excluded)} excluded of ${numberInWords(d.rows.length)} parsed.`;
}
function diagEditCell(rowIdx, field, value) {
  const row = state.diag.rows[rowIdx];
  const col = state.diag.mapping[field];
  if (col >= 0) { row.cells[col] = value; }
  else {
    // create a synthetic column for this field
    state.diag.header.push(field);
    state.diag.mapping[field] = state.diag.header.length - 1;
    for (const r of state.diag.rows) r.cells[state.diag.mapping[field]] = r === row ? value : '';
  }
  renderDiag();
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
function buildOptions() {
  refs.filter.innerHTML = [['all', 'All classes'], ...ASSET_CLASSES.map((c) => [c, c])]
    .map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  refs.activityFilterSel.innerHTML = [['all', 'All types'], ...ACTIVITY_TYPES.map((t) => [t, t])]
    .map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  refs.fClass.innerHTML = ASSET_CLASSES.map((c) => `<option value="${c}">${c}</option>`).join('');
  refs.fCurrency.innerHTML = CURRENCIES.map((c) => `<option value="${c}">${c}</option>`).join('');
  refs.fSource.innerHTML = DATA_SOURCES.map((c) => `<option value="${c}">${c}</option>`).join('');
  refs.aType.innerHTML = ACTIVITY_TYPES.map((c) => `<option value="${c}">${c}</option>`).join('');
  refs.aCurrency.innerHTML = CURRENCIES.map((c) => `<option value="${c}">${c}</option>`).join('');
  refs.aSource.innerHTML = DATA_SOURCES.map((c) => `<option value="${c}">${c}</option>`).join('');
  refs.bulkClass.innerHTML = ['<option value="">Class…</option>', ...ASSET_CLASSES.map((c) => `<option value="${c}">${c}</option>`)].join('');
  refs.bulkSource.innerHTML = ['<option value="">Source…</option>', ...DATA_SOURCES.map((c) => `<option value="${c}">${c}</option>`)].join('');
  refs.bulkActSource.innerHTML = ['<option value="">Source…</option>', ...DATA_SOURCES.map((c) => `<option value="${c}">${c}</option>`)].join('');
}

function grab() {
  const ids = {
    filter: 'class-filter', activityFilterSel: 'activity-filter', netWorth: 'net-worth', meta: 'portfolio-meta',
    allocation: 'allocation-list', perfFigures: 'perf-figures', chartWrap: 'chart-wrap', chartLegend: 'chart-legend',
    benchmarkToggle: 'benchmark-toggle', addHoldingBtn: 'add-holding-btn', holdingForm: 'holding-form',
    fName: 'f-name', fSymbol: 'f-symbol', fClass: 'f-class', fQty: 'f-qty', fPrice: 'f-price', fCurrency: 'f-currency', fSource: 'f-source',
    fMarket: 'f-market', saveHoldingBtn: 'save-holding-btn', formError: 'form-error',
    body: 'holdings-body', emptyState: 'empty-state', holdingsSelectAll: 'holdings-select-all',
    holdingsTray: 'holdings-tray', holdingsTrayCount: 'holdings-tray-count', bulkClass: 'bulk-class', bulkSource: 'bulk-source',
    bulkEditHoldings: 'bulk-edit-holdings', bulkDeleteHoldings: 'bulk-delete-holdings',
    detailName: 'detail-name', detailList: 'detail-list', detailEmpty: 'detail-empty', detailActions: 'detail-actions',
    editHoldingBtn: 'edit-holding-btn', deleteHoldingBtn: 'delete-holding-btn',
    dSymbol: 'd-symbol', dClass: 'd-class', dQty: 'd-qty', dPrice: 'd-price', dCurrency: 'd-currency', dSource: 'd-source',
    dValue: 'd-value', dAvgCost: 'd-avgcost', dCostBasis: 'd-costbasis', dUnrealized: 'd-unrealized', dRealized: 'd-realized',
    addActivityBtn: 'add-activity-btn', activityForm: 'activity-form', aType: 'a-type', aSymbol: 'a-symbol', aQty: 'a-qty',
    aPrice: 'a-price', aFee: 'a-fee', aCurrency: 'a-currency', aSource: 'a-source', aDate: 'a-date', aComment: 'a-comment',
    saveActivityBtn: 'save-activity-btn', cancelActivityBtn: 'cancel-activity-btn', activityError: 'activity-error',
    activitiesBody: 'activities-body', ledgerEmpty: 'ledger-empty', activitiesSelectAll: 'activities-select-all',
    activitiesTray: 'activities-tray', activitiesTrayCount: 'activities-tray-count', bulkActSource: 'bulk-act-source',
    bulkEditActivities: 'bulk-edit-activities', bulkDeleteActivities: 'bulk-delete-activities',
    undoBtn: 'undo-btn', exportBtn: 'export-btn', live: 'live-region', toastContainer: 'toast-container',
    drawer: 'export-drawer', drawerOverlay: 'drawer-overlay', drawerClose: 'drawer-close', exportSummary: 'export-summary',
    exportPreview: 'export-preview', copyBtn: 'copy-btn', downloadBtn: 'download-btn', copyConfirm: 'copy-confirm',
    importFile: 'import-file', importError: 'import-error',
    diagScreen: 'diag-screen', diagOverlay: 'diag-overlay', diagSummary: 'diag-summary', diagMappingGrid: 'diag-mapping-grid',
    diagThead: 'diag-thead', diagBody: 'diag-body', diagCommit: 'diag-commit', diagCancel: 'diag-cancel', diagCancelX: 'diag-cancel-x'
  };
  for (const [k, id] of Object.entries(ids)) refs[k] = el(id);
  refs.sortBtns = [...document.querySelectorAll('.sort-btn')];
  refs.drawerTabs = [...document.querySelectorAll('.drawer-tab')];
  // holding error refs
  refs.eH_name = el('e-name'); refs.eH_symbol = el('e-symbol'); refs.eH_class = el('e-class');
  refs.eH_qty = el('e-qty'); refs.eH_price = el('e-price'); refs.eH_currency = el('e-currency'); refs.eH_source = el('e-source');
  // activity error refs
  refs.eA_type = el('ae-type'); refs.eA_symbol = el('ae-symbol'); refs.eA_qty = el('ae-qty'); refs.eA_price = el('ae-price');
  refs.eA_fee = el('ae-fee'); refs.eA_currency = el('ae-currency'); refs.eA_source = el('ae-source'); refs.eA_date = el('ae-date'); refs.eA_comment = el('ae-comment');
}

function wire() {
  grab();
  buildOptions();
  resetHoldingForm();

  refs.filter.addEventListener('change', (e) => applyFilter(e.target.value));
  refs.activityFilterSel.addEventListener('change', (e) => applyActivityFilter(e.target.value));
  refs.benchmarkToggle.addEventListener('change', (e) => { state.benchmarkOn = e.target.checked; render(); });

  refs.addHoldingBtn.addEventListener('click', () => { resetHoldingForm(); refs.fName.focus(); });
  refs.holdingForm.addEventListener('submit', submitHoldingForm);
  const hInputs = { name: refs.fName, symbol: refs.fSymbol, class: refs.fClass, qty: refs.fQty, price: refs.fPrice, currency: refs.fCurrency, source: refs.fSource };
  for (const [k, node] of Object.entries(hInputs)) {
    node.addEventListener('input', () => { holdingTouched[k] = true; updateHoldingFormValidity(); });
    node.addEventListener('change', () => { holdingTouched[k] = true; updateHoldingFormValidity(); });
    node.addEventListener('blur', () => { holdingTouched[k] = true; updateHoldingFormValidity(); });
  }

  refs.editHoldingBtn.addEventListener('click', () => { const h = state.holdings.find((x) => x.id === state.selectedId); if (h) { loadHoldingIntoForm(h); refs.fName.focus(); } });
  refs.deleteHoldingBtn.addEventListener('click', () => { if (state.selectedId) deleteHolding(state.selectedId, true); });

  refs.body.addEventListener('click', (e) => {
    const cb = e.target.closest('.row-check');
    if (cb) { e.stopPropagation(); toggleHoldingSel(cb.dataset.id, cb.checked); return; }
    const tr = e.target.closest('tr[data-id]');
    if (tr) selectHolding(tr.dataset.id);
  });
  refs.body.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.classList && e.target.classList.contains('row-check')) return;
    const tr = e.target.closest('tr[data-id]');
    if (tr) { e.preventDefault(); selectHolding(tr.dataset.id); }
  });
  refs.holdingsSelectAll.addEventListener('change', (e) => selectAllHoldings(e.target.checked));
  for (const btn of refs.sortBtns) btn.addEventListener('click', () => applySort(btn.dataset.sort));

  refs.bulkDeleteHoldings.addEventListener('click', bulkDeleteHoldings);
  refs.bulkEditHoldings.addEventListener('click', () => bulkEditHoldings({ assetClass: refs.bulkClass.value || null, dataSource: refs.bulkSource.value || null }));

  refs.addActivityBtn.addEventListener('click', openActivityForm);
  refs.cancelActivityBtn.addEventListener('click', closeActivityForm);
  refs.activityForm.addEventListener('submit', submitActivityForm);
  const aInputs = { type: refs.aType, symbol: refs.aSymbol, qty: refs.aQty, price: refs.aPrice, fee: refs.aFee, currency: refs.aCurrency, source: refs.aSource, date: refs.aDate, comment: refs.aComment };
  for (const [k, node] of Object.entries(aInputs)) {
    node.addEventListener('input', () => { activityTouched[k] = true; updateActivityFormValidity(); });
    node.addEventListener('change', () => { activityTouched[k] = true; updateActivityFormValidity(); });
    node.addEventListener('blur', () => { activityTouched[k] = true; updateActivityFormValidity(); });
  }
  refs.activitiesBody.addEventListener('click', (e) => {
    const cb = e.target.closest('.act-check');
    if (cb) { toggleActivitySel(cb.dataset.id, cb.checked); }
  });
  refs.activitiesSelectAll.addEventListener('change', (e) => selectAllActivities(e.target.checked));
  refs.bulkDeleteActivities.addEventListener('click', bulkDeleteActivities);
  refs.bulkEditActivities.addEventListener('click', () => bulkEditActivities({ dataSource: refs.bulkActSource.value || null }));

  refs.undoBtn.addEventListener('click', undo);
  refs.exportBtn.addEventListener('click', openDrawer);
  refs.drawerClose.addEventListener('click', closeDrawer);
  refs.drawerOverlay.addEventListener('click', closeDrawer);
  for (const t of refs.drawerTabs) t.addEventListener('click', () => setDrawerTab(t.dataset.tab));
  refs.copyBtn.addEventListener('click', copyExport);
  refs.downloadBtn.addEventListener('click', downloadExport);
  refs.importFile.addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (f) handleImportFile(f); e.target.value = ''; });

  refs.diagCommit.addEventListener('click', commitDiag);
  refs.diagCancel.addEventListener('click', cancelDiag);
  refs.diagCancelX.addEventListener('click', cancelDiag);
  refs.diagOverlay.addEventListener('click', cancelDiag);
  refs.diagMappingGrid.addEventListener('change', (e) => {
    const sel = e.target.closest('select[data-field]');
    if (sel) { state.diag.mapping[sel.dataset.field] = Number(sel.value); renderDiag(); }
  });
  refs.diagBody.addEventListener('input', (e) => {
    const inp = e.target.closest('input[data-field]');
    if (inp) diagEditCell(Number(inp.dataset.row), inp.dataset.field, inp.value);
  });
  refs.diagBody.addEventListener('change', (e) => {
    const cb = e.target.closest('input[data-exclude]');
    if (cb) { state.diag.rows[Number(cb.dataset.exclude)].excluded = !cb.checked; renderDiag(); }
  });

  render();
  registerWebMcp();
}

// ---------------------------------------------------------------------------
// WebMCP surface
// ---------------------------------------------------------------------------
function registerWebMcp() {
  const tools = [
    { name: 'browse.open', module: 'browse-query-v1', description: 'Open a destination view (portfolio-overview, activities, export-drawer).',
      input_schema: { type: 'object', properties: { destination: { type: 'string', enum: ['portfolio-overview', 'activities', 'export-drawer'] } } },
      handler: (a = {}) => {
        const dest = a.destination || 'portfolio-overview';
        if (dest === 'export-drawer') { openDrawer(); return { ok: true, destination: dest }; }
        if (dest === 'activities') { refs.activitiesBody.scrollIntoView({ block: 'start' }); return { ok: true, destination: dest }; }
        if (dest === 'portfolio-overview') { window.scrollTo({ top: 0 }); return { ok: true, destination: dest }; }
        return { ok: false, error: 'Unknown destination' };
      } },
    { name: 'browse.apply_filter', module: 'browse-query-v1', description: 'Filter holdings by asset class or activities by type.',
      input_schema: { type: 'object', required: ['filter', 'value'], properties: { filter: { type: 'string', enum: ['asset-class', 'activity-type'] }, value: { type: 'string' } } },
      handler: (a = {}) => {
        if (a.filter === 'activity-type') { if (!ACTIVITY_TYPES.includes(a.value)) return { ok: false, error: 'Unknown activity type' }; return { ok: true, ...applyActivityFilter(a.value) }; }
        if (!ASSET_CLASSES.includes(a.value)) return { ok: false, error: 'Unknown asset class' };
        return { ok: true, ...applyFilter(a.value) };
      } },
    { name: 'browse.clear_filter', module: 'browse-query-v1', description: 'Clear the asset-class or activity-type filter.',
      input_schema: { type: 'object', properties: { filter: { type: 'string', enum: ['asset-class', 'activity-type'] } } },
      handler: (a = {}) => { if (a.filter === 'activity-type') return { ok: true, ...applyActivityFilter('all') }; return { ok: true, ...clearFilter() }; } },
    { name: 'browse.sort', module: 'browse-query-v1', description: 'Sort the holdings table by a column (toggles direction).',
      input_schema: { type: 'object', required: ['sort'], properties: { sort: { type: 'string', enum: ['name', 'symbol', 'assetClass', 'quantity', 'marketValue'] } } },
      handler: (a = {}) => ({ ok: true, ...applySort(a.sort) }) },
    { name: 'entity.create', module: 'entity-collection-v1', description: 'Create a holding (same as the Add holding form).',
      input_schema: { type: 'object', required: ['name', 'symbol', 'asset_class', 'quantity', 'unit_price', 'currency', 'data_source'],
        properties: { name: { type: 'string' }, symbol: { type: 'string' }, asset_class: { type: 'string', enum: ASSET_CLASSES }, quantity: { type: 'number' }, unit_price: { type: 'number' }, currency: { type: 'string', enum: CURRENCIES }, data_source: { type: 'string', enum: DATA_SOURCES } } },
      handler: (a = {}) => createHolding({ name: a.name, symbol: a.symbol, assetClass: a.asset_class, quantity: a.quantity, unitPrice: a.unit_price, currency: a.currency, dataSource: a.data_source }) },
    { name: 'entity.select', module: 'entity-collection-v1', description: 'Select a holding by id.',
      input_schema: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } }, handler: (a = {}) => selectHolding(a.id) },
    { name: 'entity.update', module: 'entity-collection-v1', description: 'Update fields of an existing holding.',
      input_schema: { type: 'object', required: ['id'], properties: { id: { type: 'string' }, name: { type: 'string' }, symbol: { type: 'string' }, asset_class: { type: 'string', enum: ASSET_CLASSES }, quantity: { type: 'number' }, unit_price: { type: 'number' }, currency: { type: 'string', enum: CURRENCIES }, data_source: { type: 'string', enum: DATA_SOURCES } } },
      handler: (a = {}) => {
        const patch = {};
        if (a.name !== undefined) patch.name = a.name;
        if (a.symbol !== undefined) patch.symbol = a.symbol;
        if (a.asset_class !== undefined) patch.assetClass = a.asset_class;
        if (a.quantity !== undefined) patch.quantity = a.quantity;
        if (a.unit_price !== undefined) patch.unitPrice = a.unit_price;
        if (a.currency !== undefined) patch.currency = a.currency;
        if (a.data_source !== undefined) patch.dataSource = a.data_source;
        return updateHolding(a.id, patch);
      } },
    { name: 'entity.delete', module: 'entity-collection-v1', description: 'Delete a holding. Requires confirm=true.',
      input_schema: { type: 'object', required: ['id', 'confirm'], properties: { id: { type: 'string' }, confirm: { type: 'boolean' } } },
      handler: (a = {}) => deleteHolding(a.id, a.confirm === true) },
    { name: 'artifact.export', module: 'artifact-transfer-v1', description: 'Open the export drawer for a format (json or csv). Preview compiles live; contents are not returned.',
      input_schema: { type: 'object', properties: { format: { type: 'string', enum: ['json', 'csv'] } } },
      handler: (a = {}) => { openDrawer(); if (a.format === 'csv') setDrawerTab('holdings-csv'); else setDrawerTab('json'); return { ok: true, format: a.format || 'json', holdingCount: state.holdings.length, activityCount: state.activities.length }; } },
    { name: 'artifact.copy', module: 'artifact-transfer-v1', description: 'Copy the current export preview to the clipboard (contents not returned).',
      input_schema: { type: 'object', properties: {} }, handler: () => { copyExport(); return { ok: true, format: state.drawerTab }; } },
    { name: 'artifact.import', module: 'artifact-transfer-v1', description: 'Open the import affordance for a mode. File selection stays a Playwright responsibility.',
      input_schema: { type: 'object', properties: { mode: { type: 'string', enum: ['portfolio-json', 'holdings-csv', 'activities-csv'] } } },
      handler: (a = {}) => { openDrawer(); return { ok: true, mode: a.mode || 'portfolio-json', note: 'Select a file via the Import control.' }; } }
  ];

  const registry = new Map(tools.map((t) => [t.name, t]));
  window.webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', app: 'ghostfolio', modules: ['browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1'], tool_count: tools.length });
  window.webmcp_list_tools = () => tools.map((t) => ({ name: t.name, module: t.module, description: t.description, input_schema: t.input_schema }));
  window.webmcp_invoke_tool = (name, args) => {
    const tool = registry.get(name);
    if (!tool) return { ok: false, error: `Unknown tool: ${name}` };
    try { return tool.handler(args || {}); } catch (err) { return { ok: false, error: String((err && err.message) || err) }; }
  };
  try {
    if (navigator && typeof navigator === 'object') {
      navigator.modelContext = navigator.modelContext || {};
      navigator.modelContext.tools = window.webmcp_list_tools();
      navigator.modelContext.invoke = window.webmcp_invoke_tool;
    }
  } catch (_) { /* non-fatal */ }
}

// ---------------------------------------------------------------------------
load();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
else wire();
