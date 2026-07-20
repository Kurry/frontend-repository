// Plausible Analytics oracle — view layer + shared state + WebMCP surface.
// Vanilla JS (the oracle is observed, never stack-judged). All displayed numbers
// come from the aggregation engine in data.js. The WebMCP tool handlers call the
// exact same state mutators as the visible controls.

import {
  SITES,
  SITE_IDS,
  PERIODS,
  SORTS,
  DIMENSIONS,
  DIM_LABEL,
  computeDashboard,
  formatNumber,
  formatDuration,
  generateBreakdownCSV,
  generatePanelCSV,
} from './data.js';

const STORAGE_KEY = 'plausible-analytics-state-v1';

// ---- shared client state (persisted to localStorage per source contract) ----
const defaultState = {
  site: 'example.com',
  period: 'last-30-days',
  sort: 'most-visitors',
  theme: 'light',
  filters: [], // [{ dimension, value }]
  customRange: null, // { from, to }
  compare: false,
  ceiling: 60,
  floor: 0,
  savedSegments: [], // [{ name, filters }]
  addedSites: [], // [{ name, domain, timezone }]
  addedGoals: [], // [{ name, goal_type, match_key }]
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw);
    const s = { ...defaultState, ...parsed };
    if (!SITE_IDS.includes(s.site)) s.site = defaultState.site;
    const validCustomPeriod = s.period === 'custom' && s.customRange
      && typeof s.customRange.from === 'string' && typeof s.customRange.to === 'string';
    if (!PERIODS.some((p) => p.id === s.period) && !validCustomPeriod) s.period = defaultState.period;
    if (!SORTS.some((p) => p.id === s.sort)) s.sort = defaultState.sort;
    if (s.theme !== 'light' && s.theme !== 'dark') s.theme = 'light';
    if (!Array.isArray(s.filters)) s.filters = [];
    s.filters = s.filters.filter(f => DIMENSIONS.includes(f.dimension) && typeof f.value === 'string');
    
    if (s.customRange && (typeof s.customRange.from !== 'string' || typeof s.customRange.to !== 'string')) {
        s.customRange = null;
    }
    s.compare = !!s.compare;
    s.ceiling = Number.isInteger(s.ceiling) && s.ceiling >= 0 && s.ceiling <= 100 ? s.ceiling : defaultState.ceiling;
    s.floor = Number.isInteger(s.floor) && s.floor >= 0 && s.floor <= 1000000 ? s.floor : defaultState.floor;
    if (!Array.isArray(s.savedSegments)) s.savedSegments = [];
    if (!Array.isArray(s.addedSites)) s.addedSites = [];
    if (!Array.isArray(s.addedGoals)) s.addedGoals = [];
    return s;
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — remain in memory */
  }
}

let state = loadState();
const undoStack = [];
const redoStack = [];
let segmentsMenuOpen = false; // transient UI state for the Segments dropdown

function snapshotState() {
  return JSON.parse(JSON.stringify(state));
}

function pushUndo() {
  undoStack.push(snapshotState());
  redoStack.length = 0;
}

function restoreState(snapshot) {
  state = JSON.parse(JSON.stringify(snapshot));
  hydrateAddedSites();
  commit();
}

function handleUndo() {
  const previous = undoStack.pop();
  if (!previous) return false;
  redoStack.push(snapshotState());
  restoreState(previous);
  return true;
}

function handleRedo() {
  const next = redoStack.pop();
  if (!next) return false;
  undoStack.push(snapshotState());
  restoreState(next);
  return true;
}

// Sync the SITES/SITE_IDS registries with state.addedSites: add entries for
// added sites and remove non-seeded entries that are no longer in state
// (e.g. after an undo of an add-site action or a state restore).
const SEEDED_SITE_IDS = SITE_IDS.slice();
function hydrateAddedSites() {
    const wanted = new Set(state.addedSites.map((s) => s.domain));
    for (let i = SITE_IDS.length - 1; i >= 0; i--) {
        const id = SITE_IDS[i];
        if (!SEEDED_SITE_IDS.includes(id) && !wanted.has(id)) {
            SITE_IDS.splice(i, 1);
            delete SITES[id];
        }
    }
    for (const site of state.addedSites) {
        if (!SITES[site.domain]) {
            SITES[site.domain] = {
                id: site.domain, label: site.domain, visitors: 0, pageviews: 0, bounceRate: 0, avgDuration: 0,
                sources: [], pages: [], countries: [], name: site.name, timezone: site.timezone
            };
            if (!SITE_IDS.includes(site.domain)) {
                SITE_IDS.push(site.domain);
            }
        }
    }
}
hydrateAddedSites();

// ---- state mutators (the ONE code path shared by UI + WebMCP) ---------------
function setSite(siteId) {
  if (!SITE_IDS.includes(siteId)) return false;
  state.site = siteId;
  state.filters = []; // switching site clears the complete stale segment stack
  commit();
  return true;
}

function setPeriod(periodId) {
  if (periodId === 'custom') {
    state.period = 'custom';
    if (!state.customRange) state.customRange = { from: '2026-06-24', to: '2026-06-30' };
    state.filters = [];
    commit();
    return true;
  }
  if (!PERIODS.some((p) => p.id === periodId)) return false;
  state.period = periodId;
  state.customRange = null;
  state.filters = [];
  commit();
  return true;
}

function setSort(sortId) {
  if (!SORTS.some((p) => p.id === sortId)) return false;
  state.sort = sortId;
  commit();
  return true;
}

function setTheme(theme) {
  if (theme !== 'light' && theme !== 'dark') return false;
  state.theme = theme;
  commit();
  return true;
}

function toggleCompare() {
  pushUndo();
  state.compare = !state.compare;
  commit();
  return true;
}

function setCeiling(val) {
  if (!Number.isInteger(val) || val < 0 || val > 100) return false;
  pushUndo();
  state.ceiling = val;
  commit();
  return true;
}

function setFloor(val) {
  if (!Number.isInteger(val) || val < 0 || val > 1000000) return false;
  pushUndo();
  state.floor = val;
  commit();
  return true;
}

function applyFilter(dimension, value) {
  if (!DIMENSIONS.includes(dimension)) return false;
  const key = dimension === 'source' ? 'sources' : dimension === 'page' ? 'pages' : 'countries';
  const exists = SITES[state.site][key].some((e) => e.name === value);
  if (!exists) return false;
  
  pushUndo();
  state.filters = state.filters.filter(f => f.dimension !== dimension);
  state.filters.push({ dimension, value });
  commit();
  return true;
}

function removeFilter(dimension) {
  const had = state.filters.some(f => f.dimension === dimension);
  if (had) {
      pushUndo();
      state.filters = state.filters.filter(f => f.dimension !== dimension);
      commit();
  }
  return had;
}

function clearFilter() {
  const had = state.filters.length > 0;
  if (had) {
      pushUndo();
      state.filters = [];
      commit();
  }
  return had;
}

// Seeded data window bounding custom date ranges (12 months ending at the
// seed's "today"). Dates outside this span have no seeded data.
const SEED_WINDOW_FROM = '2025-07-01';
const SEED_WINDOW_TO = '2026-06-30';

// Returns an object of field-name -> inline message; empty when valid.
function validateCustomRange(from, to) {
  const errors = {};
  if (!from) errors['custom-from'] = 'Custom range from date is required';
  else if (from < SEED_WINDOW_FROM || from > SEED_WINDOW_TO) {
    errors['custom-from'] = `Custom range from must be within ${SEED_WINDOW_FROM} to ${SEED_WINDOW_TO}`;
  }
  if (!to) errors['custom-to'] = 'Custom range to date is required';
  else if (to < SEED_WINDOW_FROM || to > SEED_WINDOW_TO) {
    errors['custom-to'] = `Custom range to must be within ${SEED_WINDOW_FROM} to ${SEED_WINDOW_TO}`;
  } else if (from && !errors['custom-from'] && from > to) {
    errors['custom-to'] = 'Custom range to must be on or after the from date';
  }
  return errors;
}

// The ONE custom-range code path shared by the UI Apply button and WebMCP.
function applyCustomRange(from, to) {
  if (Object.keys(validateCustomRange(from, to)).length > 0) return false;
  pushUndo();
  state.period = 'custom';
  state.customRange = { from, to };
  state.filters = [];
  commit();
  return true;
}

function commit() {
  saveState();
  render();
}

// ---- rendering --------------------------------------------------------------
const root = document.getElementById('root');

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

function panelNode(title, dim, entries) {
  const list = el('ul', { class: 'rows', role: 'list' });
  if (entries.length === 0) {
    list.appendChild(el('li', { class: 'panel-empty', text: 'No data for this segment' }));
  }
  for (const e of entries) {
    const active = state.filters.some(f => f.dimension === dim && f.value === e.name);
    const li = el('li');
    const btn = el(
      'button',
      {
        class: 'row',
        type: 'button',
        'aria-pressed': active ? 'true' : 'false',
        'aria-label': `Filter by ${DIM_LABEL[dim].toLowerCase()} ${e.name}, ${formatNumber(e.visitors)} visitors`,
        onclick: () => applyFilter(dim, e.name),
      },
      [
        el('span', { class: 'name', text: e.name }),
        el('span', { class: 'val', text: formatNumber(e.visitors) }),
      ],
    );
    
    // Compare logic
    const prevPanels = window.currentModel ? window.currentModel.previousPanels : null;
    if (state.compare && prevPanels && prevPanels[dim]) {
        const prevVal = prevPanels[dim][e.name] || 0;
        if (prevVal > 0) {
            const pct = Math.round(((e.visitors - prevVal) / prevVal) * 100);
            const sign = pct > 0 ? '+' : '';
            btn.appendChild(el('span', { class: `chip ${pct >= 0 ? 'pos' : 'neg'}`, text: `${sign}${pct}%` }));
        } else {
            btn.appendChild(el('span', { class: 'chip new', text: 'New' }));
        }
    }

    li.appendChild(btn);
    list.appendChild(li);
  }
  const exportBtn = el('button', { class: 'iconbtn export-panel', title: 'Export per-panel CSV', text: '↓', onclick: () => {
      const text = generatePanelCSV(dim, window.currentModel);
      navigator.clipboard.writeText(text);
  }});
  return el('section', { class: 'card panel' }, [
      el('div', { class: 'panel-header' }, [el('h2', { text: title }), exportBtn]), 
      list
  ]);
}

function render() {
  const model = computeDashboard(state.site, state.period, state.filters, state.sort, state.compare, state.addedGoals, state.customRange);
  window.currentModel = model;
  document.documentElement.setAttribute('data-theme', state.theme);
  document.title = `Plausible Analytics — ${state.site}`;

  // ---- header ----
  const siteSelect = el('select', {
    id: 'site-select',
    'aria-label': 'Site',
    onchange: (ev) => setSite(ev.target.value),
  });
  for (const id of SITE_IDS) {
    siteSelect.appendChild(el('option', { value: id, selected: id === state.site, text: id }));
  }

  const periodSelect = el('select', {
    id: 'period-select',
    'aria-label': 'Date range',
    onchange: (ev) => setPeriod(ev.target.value),
  });
  for (const p of PERIODS) {
    periodSelect.appendChild(
      el('option', { value: p.id, selected: p.id === state.period, text: p.label }),
    );
  }
  periodSelect.appendChild(el('option', { value: 'custom', selected: state.period === 'custom', text: state.customRange ? `${state.customRange.from} to ${state.customRange.to}` : 'Custom' }));
  const customFrom = el('input', { type: 'date', id: 'custom-from', 'aria-label': 'Custom range from', value: state.customRange?.from || '' });
  const customTo = el('input', { type: 'date', id: 'custom-to', 'aria-label': 'Custom range to', value: state.customRange?.to || '' });
  const customFromErr = el('div', { class: 'err-msg', id: 'err-custom-from', role: 'alert' });
  const customToErr = el('div', { class: 'err-msg', id: 'err-custom-to', role: 'alert' });
  const customRangeControl = state.period === 'custom'
    ? el('div', { class: 'control custom-range-control' }, [
        customFrom,
        customTo,
        el('button', {
          class: 'iconbtn',
          type: 'button',
          text: 'Apply range',
          onclick: () => {
            const errors = validateCustomRange(customFrom.value, customTo.value);
            customFromErr.textContent = errors['custom-from'] || '';
            customToErr.textContent = errors['custom-to'] || '';
            if (Object.keys(errors).length > 0) return;
            applyCustomRange(customFrom.value, customTo.value);
          },
        }),
        customFromErr,
        customToErr,
      ])
    : null;

  const sortSelect = el('select', {
    id: 'sort-select',
    'aria-label': 'Sort breakdowns',
    onchange: (ev) => setSort(ev.target.value),
  });
  for (const s of SORTS) {
    sortSelect.appendChild(el('option', { value: s.id, selected: s.id === state.sort, text: s.label }));
  }

  const themeBtn = el('button', {
    class: 'iconbtn',
    id: 'theme-toggle',
    type: 'button',
    'aria-label': state.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme',
    onclick: () => setTheme(state.theme === 'light' ? 'dark' : 'light'),
    text: state.theme === 'light' ? 'Dark' : 'Light',
  });

  const undoBtn = el('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Undo', disabled: undoStack.length === 0 ? 'disabled' : false, onclick: handleUndo, text: '↶' });
  const redoBtn = el('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Redo', disabled: redoStack.length === 0 ? 'disabled' : false, onclick: handleRedo, text: '↷' });
  const compareBtn = el('button', { class: `iconbtn ${state.compare ? 'active' : ''}`, type: 'button', 'aria-label': 'Compare previous', onclick: toggleCompare, text: 'Compare' });
  const ceilingErr = el('div', { class: 'err-msg', id: 'err-bounce-rate-ceiling', role: 'alert' });
  const ceilingInput = el('input', { type: 'number', class: 'thresh-input', id: 'bounce-rate-ceiling', 'aria-label': 'Bounce ceiling', value: state.ceiling, min: 0, max: 100, step: 1, onchange: (e) => {
    const raw = e.target.value.trim();
    const num = Number(raw);
    if (raw === '' || !Number.isInteger(num) || num < 0 || num > 100) {
      ceilingErr.textContent = 'Bounce-rate ceiling must be an integer from 0 to 100';
      return;
    }
    ceilingErr.textContent = '';
    setCeiling(num);
  } });
  const floorErr = el('div', { class: 'err-msg', id: 'err-visitor-floor', role: 'alert' });
  const floorInput = el('input', { type: 'number', class: 'thresh-input', id: 'visitor-floor', 'aria-label': 'Visitor floor', value: state.floor, min: 0, max: 1000000, step: 1, onchange: (e) => {
    const raw = e.target.value.trim();
    const num = Number(raw);
    if (raw === '' || !Number.isInteger(num) || num < 0 || num > 1000000) {
      floorErr.textContent = 'Visitor floor must be an integer from 0 to 1,000,000';
      return;
    }
    floorErr.textContent = '';
    setFloor(num);
  } });
  const saveSegBtn = el('button', { class: 'btn', type: 'button', onclick: openSaveSegmentModal, text: 'Save segment' });
  const expBtn = el('button', { class: 'btn', type: 'button', onclick: openExportDrawer, text: 'Export report' });
  const addSiteBtn = el('button', { class: 'btn', type: 'button', onclick: openAddSiteModal, text: 'Add site' });
  const addGoalBtn = el('button', { class: 'btn', type: 'button', onclick: openAddGoalModal, text: 'Add goal' });
  
  const segMenuBtn = el('button', {
    class: 'btn',
    type: 'button',
    'aria-label': 'Segments menu',
    'aria-haspopup': 'true',
    'aria-expanded': segmentsMenuOpen ? 'true' : 'false',
    onclick: () => { segmentsMenuOpen = !segmentsMenuOpen; render(); },
    text: 'Segments',
  });
  const segMenuList = segmentsMenuOpen
    ? el('ul', { class: 'seg-menu', role: 'list' },
        state.savedSegments.length === 0
          ? [el('li', { class: 'seg-empty', text: 'No saved segments' })]
          : state.savedSegments.map(s => el('li', { class: 'seg-item' }, [
              el('button', { type: 'button', class: 'seg-apply', 'aria-label': `Apply segment ${s.name}`, onclick: () => { segmentsMenuOpen = false; applySegment(s.name); }, text: s.name }),
              el('button', { type: 'button', class: 'seg-delete', 'aria-label': `Delete segment ${s.name}`, onclick: () => deleteSegment(s.name), text: '×' }),
            ])))
    : null;
  const segSelect = el('div', { class: 'seg-menu-wrap' }, [segMenuBtn, segMenuList]);

  const controls = el('div', { class: 'controls' }, [
    el('div', { class: 'control' }, [el('label', { for: 'site-select', text: 'Site' }), siteSelect]),
    el('div', { class: 'control' }, [
      el('label', { for: 'period-select', text: 'Date range' }),
      periodSelect,
    ]),
    customRangeControl,
    el('div', { class: 'control' }, [el('label', { for: 'sort-select', text: 'Sort' }), sortSelect]),
    el('div', { class: 'control' }, [el('label', { for: 'bounce-rate-ceiling', text: 'Bounce ceil' }), ceilingInput, ceilingErr]),
    el('div', { class: 'control' }, [el('label', { for: 'visitor-floor', text: 'Vis. floor' }), floorInput, floorErr]),
    el('div', { class: 'control' }, [
      el('label', { for: 'theme-toggle', text: 'Theme' }),
      themeBtn,
    ]),
    el('div', { class: 'control' }, [undoBtn, redoBtn]),
    el('div', { class: 'control' }, [compareBtn, saveSegBtn, segSelect, expBtn, addSiteBtn, addGoalBtn])
  ]);

  const header = el('header', { class: 'topbar' }, [
    el('div', { class: 'brand' }, [
      el('div', { class: 'brand-logo', 'aria-hidden': 'true' }),
      el('div', {}, [
        el('div', { class: 'brand-title', text: 'Plausible Analytics' }),
        el('div', { class: 'brand-sub', text: state.site }),
      ]),
    ]),
    controls,
  ]);

  // ---- filter pill ----
  const nodes = [header];
  if (state.filters.length > 0) {
    const pills = state.filters.map(f => el('div', { class: 'pill' }, [
      el('span', { class: 'pill-dim', text: `${DIM_LABEL[f.dimension]}:` }),
      el('span', { text: ` ${f.value}` }),
      el('button', {
        type: 'button',
        'aria-label': `Clear ${DIM_LABEL[f.dimension].toLowerCase()} filter`,
        onclick: () => removeFilter(f.dimension),
        text: '×',
      }),
    ]));
    const clearBtn = el('button', {
      class: 'iconbtn clear-btn',
      id: 'clear-filter',
      type: 'button',
      'aria-label': 'Clear filter',
      onclick: () => clearFilter(),
    }, [el('span', { class: 'x', text: '×' }), el('span', { text: 'Clear filter' })]);
    nodes.push(el('div', { class: 'filterbar' }, [...pills, clearBtn]));
  }

  // ---- main ----
  const getComparePct = (cur, prev) => {
      if (!state.compare || prev == null || prev === 0) return null;
      return Math.round(((cur - prev) / prev) * 100);
  };

  const kpiDefs = [
    ['Unique visitors', formatNumber(model.kpi.visitors), getComparePct(model.kpi.visitors, model.previousKpi?.visitors)],
    ['Total pageviews', formatNumber(model.kpi.pageviews), getComparePct(model.kpi.pageviews, model.previousKpi?.pageviews)],
    ['Bounce rate', `${model.kpi.bounceRate}%`, getComparePct(model.kpi.bounceRate, model.previousKpi?.bounceRate)],
    ['Visit duration', formatDuration(model.kpi.avgDuration), getComparePct(model.kpi.avgDuration, model.previousKpi?.avgDuration)],
  ];
  const kpis = el(
    'div',
    { class: 'kpis' },
    kpiDefs.map(([label, value, pct]) => {
      let alertNode = null;
      if (label === 'Bounce rate' && model.kpi.bounceRate > state.ceiling) {
          alertNode = el('div', { class: 'alert', text: 'High bounce' });
      }
      if (label === 'Unique visitors' && model.kpi.visitors < state.floor) {
          alertNode = el('div', { class: 'alert', text: 'Low traffic' });
      }
      const pctNode = pct !== null ? el('span', { class: `chip ${pct >= 0 ? 'pos' : 'neg'}`, text: `${pct >= 0 ? '+' : ''}${pct}%` }) : null;
      
      return el('div', { class: 'card kpi' }, [
        el('div', { class: 'kpi-label' }, [el('span', {text: label}), alertNode]),
        el('div', { class: 'kpi-value', 'data-kpi': label }, [el('span', {text: value}), pctNode]),
      ]);
    })
  );

  const maxBar = Math.max(...model.trend, 1);
  const maxPrevBar = model.previousTrend ? Math.max(...model.previousTrend, 1) : 1;
  const overallMax = Math.max(maxBar, maxPrevBar);

  const chart = el(
    'div',
    { class: 'chart', role: 'img', 'aria-label': `Visitors trend, ${model.trend.length} periods, peak ${formatNumber(overallMax)} visitors` },
    model.trend.map((v, i) => {
      const prev = state.compare && model.previousTrend ? model.previousTrend[i] : 0;
      const prevNode = state.compare ? el('div', { class: 'bar prev-bar', style: `height:${Math.max(6, Math.round((prev / overallMax) * 100))}%` }) : null;
      return el('div', { class: 'bar-wrap', title: `${formatNumber(v)} visitors` }, [
        prevNode,
        el('div', { class: 'bar', style: `height:${Math.max(6, Math.round((v / overallMax) * 100))}%` }),
      ]);
    })
  );
  const chartCard = el('section', { class: 'card chart-card' }, [
    el('h2', { class: 'section-title', text: 'Visitors' }),
    chart,
  ]);

  const panels = el('div', { class: 'panels' }, [
    panelNode('Top Sources', 'source', model.sources.slice(0, 4)),
    panelNode('Top Pages', 'page', model.pages.slice(0, 4)),
    panelNode('Countries', 'country', model.countries.slice(0, 4)),
  ]);


  // Goals Panel
  const goalList = el('ul', { class: 'rows', role: 'list' });
  if (model.goals.length === 0) {
      goalList.appendChild(el('li', { class: 'panel-empty', text: 'No goals data' }));
  }
  for (const g of model.goals) {
      const li = el('li');
      const btn = el('div', { class: 'row' }, [
          el('span', { class: 'name', text: g.name }),
          el('span', { class: 'val', text: `${formatNumber(g.completions)} (${g.conversion_rate}%)` }),
      ]);
      li.appendChild(btn);
      goalList.appendChild(li);
  }
  const exportGoalsBtn = el('button', { class: 'iconbtn export-panel', title: 'Export per-panel CSV', text: '↓', onclick: () => {
      const text = generatePanelCSV('goals', window.currentModel);
      navigator.clipboard.writeText(text);
  }});
  const goalsPanel = el('section', { class: 'card panel' }, [
      el('div', { class: 'panel-header' }, [el('h2', { text: 'Goals' }), exportGoalsBtn]),
      goalList
  ]);

  // Funnel Panel
  const funnelList = el('div', { class: 'funnel-steps' });
  if (model.funnel.length === 0) {
      funnelList.appendChild(el('div', { class: 'panel-empty', text: 'No funnel data' }));
  }
  const maxFunnel = Math.max(...model.funnel.map(f => f.count), 1);
  for (const f of model.funnel) {
      const stepRow = el('div', { class: 'funnel-step' }, [
          el('div', { class: 'funnel-label' }, [
              el('span', { class: 'name', text: f.name }),
              el('span', { class: 'val', text: `${formatNumber(f.count)} (${f.step_conversion}%)` })
          ]),
          el('div', { class: 'funnel-bar-wrap' }, [
              el('div', { class: 'funnel-bar', style: `width:${Math.max(2, Math.round((f.count / maxFunnel) * 100))}%` })
          ])
      ]);
      funnelList.appendChild(stepRow);
  }
  const exportFunnelBtn = el('button', { class: 'iconbtn export-panel', title: 'Export per-panel CSV', text: '↓', onclick: () => {
      const text = generatePanelCSV('funnel', window.currentModel);
      navigator.clipboard.writeText(text);
  }});
  const funnelPanel = el('section', { class: 'card panel funnel-card' }, [
      el('div', { class: 'panel-header' }, [el('h2', { text: 'Funnel' }), exportFunnelBtn]),
      funnelList
  ]);

  const main = el('main', {}, [kpis, chartCard, panels, goalsPanel, funnelPanel]);
  nodes.push(main);

  root.replaceChildren(...nodes);
}

// ---- WebMCP surface ---------------------------------------------------------
const TOOLS = [
  {
    name: 'browse_open',
    operation: 'open',
    description: 'Open the dashboard for one of the tracked sites.',
    parameters: { destination: { type: 'string' } },
    handler: (a) => {
      if (a.destination === 'export-drawer') {
          openExportDrawer();
          return { ok: true, view: 'export-drawer' };
      } else if (a.destination === 'goals-view') {
          return { ok: true, view: 'goals-view' };
      }
      return setSite(a.destination)
        ? { ok: true, site: state.site }
        : { ok: false, error: `Unknown destination: ${a && a.destination}` }
    }
  },
  {
    name: 'browse_apply_filter',
    operation: 'apply_filter',
    description: 'Apply a bounded filter. dimension source/page/country segments the metrics; dimension period sets the date window.',
    parameters: {
      filter: { type: 'string' },
      value: { type: 'string' },
    },
    handler: (a) => {
      if (!a || !a.filter) return { ok: false, error: 'filter is required' };
      if (a.filter === 'period') {
        return setPeriod(a.value)
          ? { ok: true, period: state.period }
          : { ok: false, error: `Unknown period: ${a.value}` };
      } else if (a.filter === 'saved-segment') {
        return applySegment(a.value)
          ? { ok: true, segment: a.value }
          : { ok: false, error: `Unknown segment: ${a.value}` };
      } else if (a.filter === 'custom-range') {
        // expect value to be 'YYYY-MM-DD - YYYY-MM-DD'
        const parts = String(a.value || '').split(' - ');
        if (parts.length === 2 && applyCustomRange(parts[0], parts[1])) {
            return { ok: true, customRange: state.customRange };
        }
        return { ok: false, error: 'Invalid custom range' };
      }
      return applyFilter(a.filter, a.value)
        ? { ok: true, filters: state.filters }
        : { ok: false, error: `Unknown ${a.filter}: ${a.value}` };
    },
  },
  {
    name: 'browse_clear_filter',
    operation: 'clear_filter',
    description: 'Clear the active segment filter and return to the unfiltered dashboard.',
    parameters: {},
    handler: () => ({ ok: true, cleared: clearFilter(), filters: state.filters }),
  },
  {
    name: 'browse_sort',
    operation: 'sort',
    description: 'Sort the breakdown panels.',
    parameters: { sort: { type: 'string' } },
    handler: (a) =>
      setSort(a && a.sort) ? { ok: true, sort: state.sort } : { ok: false, error: `Unknown sort: ${a && a.sort}` },
  },
  {
    name: 'browse_set_theme',
    operation: 'set_theme',
    description: 'Switch the color theme.',
    parameters: { theme: { type: 'string', enum: ['light', 'dark'] } },
    handler: (a) =>
      setTheme(a && a.theme) ? { ok: true, theme: state.theme } : { ok: false, error: `Unknown theme: ${a && a.theme}` },
  },
  {
    name: 'form_validate',
    operation: 'validate',
    description: 'Validate form fields without submitting.',
    parameters: { fields: { type: 'object' } },
    handler: (a) => {
        if (!a || !a.fields || typeof a.fields !== 'object') {
            return { ok: false, error: 'fields is required' };
        }
        const errors = validateFields(a.fields);
        return { ok: true, valid: Object.keys(errors).length === 0, errors };
    }
  },
  {
    name: 'form_submit',
    operation: 'submit',
    description: 'Submit a form with provided fields.',
    parameters: { 
        form: { type: 'string' },
        fields: { type: 'object' }
    },
    handler: (a) => {
        if (!a || !a.fields) return { ok: false };
        const errors = validateFields(a.fields);
        if (Object.keys(errors).length > 0) return { ok: false, errors };
        if (a.fields['site-name']) {
            const domain = a.fields['domain'];
            const name = a.fields['site-name'];
            const tz = a.fields['timezone'];
            return addSite(domain, name, tz) ? { ok: true } : { ok: false };
        } else if (a.fields['goal-name']) {
            return addGoal(a.fields['goal-name'], a.fields['goal-type'], a.fields['goal-match-key']) ? { ok: true } : { ok: false };
        } else if (a.fields['bounce-rate-ceiling'] !== undefined) {
            return setCeiling(Number(a.fields['bounce-rate-ceiling'])) ? { ok: true } : { ok: false };
        } else if (a.fields['visitor-floor'] !== undefined) {
            return setFloor(Number(a.fields['visitor-floor'])) ? { ok: true } : { ok: false };
        } else if (a.fields['segment-name']) {
            return saveSegment(a.fields['segment-name']) ? { ok: true } : { ok: false };
        } else if (a.fields['custom-from'] && a.fields['custom-to']) {
            return applyCustomRange(a.fields['custom-from'], a.fields['custom-to']) ? { ok: true } : { ok: false };
        }
        return { ok: false };
    }
  },
  {
    name: 'form_cancel',
    operation: 'cancel',
    description: 'Cancel the current form.',
    parameters: {},
    handler: () => {
        closeAllModals();
        return { ok: true };
    }
  },
  {
    name: 'artifact_export',
    operation: 'export',
    description: 'Export report.',
    parameters: { format: { type: 'string' }, type: { type: 'string' } },
    handler: (a) => {
        if (!a) return { ok: false };
        if (a.format === 'stats-json') return { ok: true, text: generateStatsJSON() };
        if (a.format === 'breakdown-csv') return { ok: true, text: generateBreakdownCSV(window.currentModel) };
        if (a.format === 'panel-csv' && a.type) return { ok: true, text: generatePanelCSV(a.type, window.currentModel) };
        return { ok: false };
    }
  },
  {
    name: 'artifact_import',
    operation: 'import',
    description: 'Import stats JSON.',
    parameters: { content: { type: 'string' } },
    handler: (a) => {
        if (!a || !a.content) return { ok: false };
        return importStatsJSON(a.content) ? { ok: true } : { ok: false };
    }
  },
  {
    name: 'artifact_copy',
    operation: 'copy',
    description: 'Copy text.',
    parameters: { text: { type: 'string' } },
    handler: (a) => {
        const text = a && a.text;
        if (!text) return { ok: false, error: 'text is required' };
        navigator.clipboard.writeText(text).catch(() => {});
        return { ok: true };
    }
  }
];

window.webmcp_session_info = () => ({
  contract_version: 'zto-webmcp-v1',
  task: 'frontend-plausible-analytics',
  modules: ['browse-query-v1'],
  state: {
    site: state.site,
    period: state.period,
    sort: state.sort,
    theme: state.theme,
    filters: state.filters,
  },
});

window.webmcp_list_tools = () =>
  TOOLS.map((t) => ({
    name: t.name,
    operation: t.operation,
    description: t.description,
    parameters: t.parameters,
  }));

window.webmcp_invoke_tool = (name, args) => {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { ok: false, error: `Unknown tool: ${name}` };
  return tool.handler(args || {});
};

// Optional navigator.modelContext registration alongside the window surface.
try {
  if (typeof navigator !== 'undefined') {
    navigator.modelContext = navigator.modelContext || {};
    navigator.modelContext.tools = window.webmcp_list_tools();
    navigator.modelContext.invoke = window.webmcp_invoke_tool;
  }
} catch {
  /* non-fatal */
}

render();

// ---- Modals and Form Actions ------------------------------------------------

// Focus trap helper
function trapFocus(modalEl, closeBtn) {
    const focusable = modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    modalEl.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeBtn.click();
            return;
        }
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        }
    });
}

function closeAllModals() {
    const active = document.querySelector('.modal.active');
    if (active) active.classList.remove('active');
    const activeDrawer = document.querySelector('.drawer.active');
    if (activeDrawer) activeDrawer.classList.remove('active');
}

function addSite(domain, name, timezone) {
    if (!domain || !name || !timezone) return false;
    // Reject duplicates: a rapid double-submit or re-adding a seeded/already-added
    // domain must not create a second entry for the same site.
    if (SITE_IDS.includes(domain) || state.addedSites.some((s) => s.domain === domain)) return false;
    pushUndo();
    state.addedSites.push({ domain, name, timezone });
    hydrateAddedSites();
    commit();
    return true;
}

function openAddSiteModal() {
    closeAllModals();
    const opener = document.activeElement;
    let modal = document.getElementById('add-site-modal');
    
    if (!modal) {
        const title = el('h2', { text: 'Add Site' });
        
        const nameInput = el('input', { id: 'site-name', type: 'text' });
        const nameErr = el('div', { class: 'err-msg', id: 'err-site-name', role: 'alert' });
        const domainInput = el('input', { id: 'domain', type: 'text' });
        const domainErr = el('div', { class: 'err-msg', id: 'err-domain', role: 'alert' });

        const tzSelect = el('select', { id: 'timezone' }, [
            el('option', { value: '', text: 'Select...' }),
            el('option', { value: 'UTC', text: 'UTC' }),
            el('option', { value: 'America/New_York', text: 'America/New_York' }),
            el('option', { value: 'Europe/London', text: 'Europe/London' }),
            el('option', { value: 'Asia/Tokyo', text: 'Asia/Tokyo' }),
        ]);
        const tzErr = el('div', { class: 'err-msg', id: 'err-timezone', role: 'alert' });

        const submitBtn = el('button', { type: 'button', class: 'btn primary', text: 'Submit', disabled: 'disabled' });
        const closeBtn = el('button', { type: 'button', class: 'btn', text: 'Cancel' });

        const validate = () => {
            let isValid = true;
            
            // Name 1-64 chars
            const n = nameInput.value.trim();
            if (n.length < 1 || n.length > 64) {
                nameErr.textContent = 'Site name must be 1 to 64 characters';
                isValid = false;
            } else { nameErr.textContent = ''; }
            
            // Domain rule: hostname without protocol/path/whitespace
            const d = domainInput.value.trim();
            const dRegex = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
            if (!dRegex.test(d) || d.length < 3 || d.length > 253) {
                domainErr.textContent = 'Invalid domain format';
                isValid = false;
            } else if (SITE_IDS.includes(d) || state.addedSites.some((s) => s.domain === d)) {
                domainErr.textContent = 'A site with this domain already exists';
                isValid = false;
            } else { domainErr.textContent = ''; }
            
            // Timezone
            const tz = tzSelect.value;
            if (!['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'].includes(tz)) {
                tzErr.textContent = 'Invalid timezone';
                isValid = false;
            } else { tzErr.textContent = ''; }

            if (isValid) {
                submitBtn.removeAttribute('disabled');
            } else {
                submitBtn.setAttribute('disabled', 'disabled');
            }
            return isValid;
        };

        nameInput.addEventListener('input', validate);
        domainInput.addEventListener('input', validate);
        tzSelect.addEventListener('change', validate);

        submitBtn.addEventListener('click', () => {
            if (validate()) {
                addSite(domainInput.value.trim(), nameInput.value.trim(), tzSelect.value);
                modal.classList.remove('active');
                if (opener) opener.focus();
            }
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            if (opener) opener.focus();
        });

        const form = el('form', { class: 'modal-form' }, [
            el('div', { class: 'field' }, [el('label', { for: 'site-name', text: 'Site Name' }), nameInput, nameErr]),
            el('div', { class: 'field' }, [el('label', { for: 'domain', text: 'Domain' }), domainInput, domainErr]),
            el('div', { class: 'field' }, [el('label', { for: 'timezone', text: 'Timezone' }), tzSelect, tzErr]),
            el('div', { class: 'actions' }, [closeBtn, submitBtn])
        ]);

        modal = el('div', { id: 'add-site-modal', class: 'modal active', role: 'dialog', 'aria-modal': 'true' }, [
            el('div', { class: 'modal-content' }, [title, form])
        ]);
        document.body.appendChild(modal);
        trapFocus(modal, closeBtn);
    } else {
        modal.classList.add('active');
    }
    
    setTimeout(() => {
        const firstInput = modal.querySelector('input');
        if (firstInput) firstInput.focus();
    }, 100);
}

function addGoal(name, goal_type, match_key) {
    if (!name || !goal_type || !match_key) return false;
    // Disallow duplicates
    const allNames = state.addedGoals.map(g => g.name).concat(['Signup', 'Pricing viewed', 'Docs read']);
    if (allNames.includes(name)) return false;
    
    pushUndo();
    state.addedGoals.push({ name, goal_type, match_key });
    commit();
    return true;
}

function openAddGoalModal() {
    closeAllModals();
    const opener = document.activeElement;
    let modal = document.getElementById('add-goal-modal');
    
    if (!modal) {
        const title = el('h2', { text: 'Add Goal' });
        
        const nameInput = el('input', { id: 'goal-name', type: 'text' });
        const nameErr = el('div', { class: 'err-msg', id: 'err-goal-name', role: 'alert' });

        const typeSelect = el('select', { id: 'goal-type' }, [
            el('option', { value: '', text: 'Select...' }),
            el('option', { value: 'event', text: 'event' }),
            el('option', { value: 'page', text: 'page' })
        ]);
        const typeErr = el('div', { class: 'err-msg', id: 'err-goal-type', role: 'alert' });

        const matchInput = el('input', { id: 'goal-match-key', type: 'text' });
        const matchErr = el('div', { class: 'err-msg', id: 'err-goal-match-key', role: 'alert' });
        
        const submitBtn = el('button', { type: 'button', class: 'btn primary', text: 'Submit', disabled: 'disabled' });
        const closeBtn = el('button', { type: 'button', class: 'btn', text: 'Cancel' });

        const validate = () => {
            let isValid = true;
            
            const n = nameInput.value.trim();
            const allNames = state.addedGoals.map(g => g.name).concat(['Signup', 'Pricing viewed', 'Docs read']);
            if (n.length < 1 || n.length > 64) {
                nameErr.textContent = 'Name must be 1 to 64 characters';
                isValid = false;
            } else if (allNames.includes(n)) {
                nameErr.textContent = 'Goal name already exists';
                isValid = false;
            } else { nameErr.textContent = ''; }
            
            const t = typeSelect.value;
            if (!['event', 'page'].includes(t)) {
                typeErr.textContent = 'Invalid goal type';
                isValid = false;
            } else { typeErr.textContent = ''; }

            const m = matchInput.value;
            if (m.length < 1 || m.length > 200) {
                matchErr.textContent = 'Match key must be 1 to 200 characters';
                isValid = false;
            } else if (t === 'event') {
                if (/[\\s]/.test(m) || !/^[a-zA-Z0-9._-]+$/.test(m)) {
                    matchErr.textContent = 'Event match key cannot contain whitespace or invalid chars';
                    isValid = false;
                } else { matchErr.textContent = ''; }
            } else if (t === 'page') {
                if (!m.startsWith('/') || /[\\s]/.test(m) || m === '/') {
                    matchErr.textContent = 'Page match key must start with / and not be only /';
                    isValid = false;
                } else { matchErr.textContent = ''; }
            } else {
                matchErr.textContent = '';
            }

            if (isValid) {
                submitBtn.removeAttribute('disabled');
            } else {
                submitBtn.setAttribute('disabled', 'disabled');
            }
            return isValid;
        };

        nameInput.addEventListener('input', validate);
        typeSelect.addEventListener('change', validate);
        matchInput.addEventListener('input', validate);

        submitBtn.addEventListener('click', () => {
            if (validate()) {
                addGoal(nameInput.value.trim(), typeSelect.value, matchInput.value);
                modal.classList.remove('active');
                if (opener) opener.focus();
            }
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            if (opener) opener.focus();
        });

        const form = el('form', { class: 'modal-form' }, [
            el('div', { class: 'field' }, [el('label', { for: 'goal-name', text: 'Name' }), nameInput, nameErr]),
            el('div', { class: 'field' }, [el('label', { for: 'goal-type', text: 'Goal Type' }), typeSelect, typeErr]),
            el('div', { class: 'field' }, [el('label', { for: 'goal-match-key', text: 'Match Key' }), matchInput, matchErr]),
            el('div', { class: 'actions' }, [closeBtn, submitBtn])
        ]);

        modal = el('div', { id: 'add-goal-modal', class: 'modal active', role: 'dialog', 'aria-modal': 'true' }, [
            el('div', { class: 'modal-content' }, [title, form])
        ]);
        document.body.appendChild(modal);
        trapFocus(modal, closeBtn);
    } else {
        modal.classList.add('active');
    }
    
    setTimeout(() => {
        const firstInput = modal.querySelector('input');
        if (firstInput) firstInput.focus();
    }, 100);
}


function saveSegment(name) {
    if (!name || state.filters.length === 0) return false;
    const exists = state.savedSegments.some(s => s.name === name);
    if (exists) return false;
    
    pushUndo();
    state.savedSegments.push({ name, filters: [...state.filters] });
    commit();
    return true;
}

function openSaveSegmentModal() {
    closeAllModals();
    const opener = document.activeElement;
    let modal = document.getElementById('save-segment-modal');
    
    if (!modal) {
        const title = el('h2', { text: 'Save Segment' });
        
        const nameInput = el('input', { id: 'segment-name', type: 'text' });
        const nameErr = el('div', { class: 'err-msg', id: 'err-segment-name', role: 'alert' });
        const filterErr = el('div', { class: 'err-msg', id: 'err-segment-filters', role: 'alert' });
        
        const submitBtn = el('button', { type: 'button', class: 'btn primary', text: 'Submit', disabled: 'disabled' });
        const closeBtn = el('button', { type: 'button', class: 'btn', text: 'Cancel' });

        // `showNameError` is false on the initial open sync so we don't yell
        // "name required" before the user has typed anything; the filter-stack
        // check is surfaced unconditionally since it reflects state the user
        // set before opening this modal, not something typing here can fix.
        const validate = (showNameError = true) => {
            let isValid = true;

            const n = nameInput.value.trim();
            if (n.length < 1 || n.length > 40) {
                if (showNameError) nameErr.textContent = 'Name must be 1 to 40 characters';
                isValid = false;
            } else if (state.savedSegments.some(s => s.name === n)) {
                if (showNameError) nameErr.textContent = 'Segment name already exists';
                isValid = false;
            } else if (showNameError) { nameErr.textContent = ''; }

            if (state.filters.length === 0) {
                filterErr.textContent = 'Cannot save segment with no active filters';
                isValid = false;
            } else { filterErr.textContent = ''; }

            if (isValid) {
                submitBtn.removeAttribute('disabled');
            } else {
                submitBtn.setAttribute('disabled', 'disabled');
            }
            return isValid;
        };

        nameInput.addEventListener('input', () => validate(true));

        submitBtn.addEventListener('click', () => {
            if (validate()) {
                saveSegment(nameInput.value.trim());
                modal.classList.remove('active');
                if (opener) opener.focus();
            }
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            if (opener) opener.focus();
        });

        const form = el('form', { class: 'modal-form' }, [
            el('div', { class: 'field' }, [el('label', { for: 'segment-name', text: 'Segment Name' }), nameInput, nameErr, filterErr]),
            el('div', { class: 'actions' }, [closeBtn, submitBtn])
        ]);

        modal = el('div', { id: 'save-segment-modal', class: 'modal active', role: 'dialog', 'aria-modal': 'true' }, [
            el('div', { class: 'modal-content' }, [title, form])
        ]);
        // Stash validate on the (cached) modal element so a later reopen can
        // re-run it too — state.filters may have changed since the modal was
        // first built, and otherwise the "no active filters" error only
        // appears once the name field is typed into, not on open.
        modal._validate = validate;
        document.body.appendChild(modal);
        trapFocus(modal, closeBtn);
    } else {
        modal.classList.add('active');
    }
    if (typeof modal._validate === 'function') modal._validate(false);

    setTimeout(() => {
        const firstInput = modal.querySelector('input');
        if (firstInput) firstInput.focus();
    }, 100);
}

function deleteSegment(name) {
    const exists = state.savedSegments.some(s => s.name === name);
    if (!exists) return false;
    pushUndo();
    state.savedSegments = state.savedSegments.filter(s => s.name !== name);
    commit();
    return true;
}

function applySegment(name) {
    const seg = state.savedSegments.find(s => s.name === name);
    if (!seg) return false;
    pushUndo();
    state.filters = [...seg.filters];
    commit();
    return true;
}

// Field-level validation mirroring the visible forms, shared with the
// form_validate WebMCP tool so it surfaces the same failures as the UI.
function validateFields(fields) {
    const errors = {};
    const has = (k) => fields[k] !== undefined && fields[k] !== null;
    if (has('site-name')) {
        const n = String(fields['site-name']).trim();
        if (n.length < 1 || n.length > 64) errors['site-name'] = 'Site name must be 1 to 64 characters';
    }
    if (has('domain')) {
        const d = String(fields['domain']).trim();
        if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) || d.length < 3 || d.length > 253) errors['domain'] = 'Invalid domain format';
        else if (SITE_IDS.includes(d) || state.addedSites.some((s) => s.domain === d)) errors['domain'] = 'A site with this domain already exists';
    }
    if (has('timezone')) {
        if (!['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'].includes(fields['timezone'])) errors['timezone'] = 'Invalid timezone';
    }
    if (has('bounce-rate-ceiling')) {
        const v = Number(fields['bounce-rate-ceiling']);
        if (!Number.isInteger(v) || v < 0 || v > 100) errors['bounce-rate-ceiling'] = 'Bounce-rate ceiling must be an integer from 0 to 100';
    }
    if (has('visitor-floor')) {
        const v = Number(fields['visitor-floor']);
        if (!Number.isInteger(v) || v < 0 || v > 1000000) errors['visitor-floor'] = 'Visitor floor must be an integer from 0 to 1,000,000';
    }
    if (has('segment-name')) {
        const n = String(fields['segment-name']).trim();
        if (n.length < 1 || n.length > 40) errors['segment-name'] = 'Segment name must be 1 to 40 characters';
        else if (state.savedSegments.some((s) => s.name === n)) errors['segment-name'] = 'Segment name already exists';
    }
    if (has('custom-from') || has('custom-to')) {
        Object.assign(errors, validateCustomRange(fields['custom-from'], fields['custom-to']));
    }
    if (has('goal-name')) {
        const n = String(fields['goal-name']).trim();
        const allNames = state.addedGoals.map((g) => g.name).concat(['Signup', 'Pricing viewed', 'Docs read']);
        if (n.length < 1 || n.length > 64) errors['goal-name'] = 'Goal name must be 1 to 64 characters';
        else if (allNames.includes(n)) errors['goal-name'] = 'Goal name already exists';
    }
    if (has('goal-type') && !['event', 'page'].includes(fields['goal-type'])) {
        errors['goal-type'] = 'Goal type must be event or page';
    }
    if (has('goal-match-key')) {
        const m = String(fields['goal-match-key']);
        const t = fields['goal-type'];
        if (m.length < 1 || m.length > 200) errors['goal-match-key'] = 'Match key must be 1 to 200 characters';
        else if (t === 'event' && !/^[a-zA-Z0-9._-]+$/.test(m)) errors['goal-match-key'] = 'Event match key cannot contain whitespace or invalid chars';
        else if (t === 'page' && (!m.startsWith('/') || /\s/.test(m) || m === '/')) errors['goal-match-key'] = 'Page match key must start with / and not be only /';
    }
    if (has('import')) {
        try {
            const parsed = JSON.parse(String(fields['import']));
            if (!parsed || parsed.schema_version !== 'plausible-stats-v1' || !parsed.results || !parsed.sites) {
                errors['import'] = 'Invalid or malformed Stats JSON';
            }
        } catch {
            errors['import'] = 'Invalid or malformed Stats JSON';
        }
    }
    return errors;
}

// Generate the Stats JSON object dynamically from current state and computed dashboard.
function generateStatsJSON() {
    const d = computeDashboard(state.site, state.period, state.filters, state.sort, state.compare, state.addedGoals, state.customRange);
    if (!d) return '{}';
    
    const obj = {
        schema_version: 'plausible-stats-v1',
        site: {
            domain: d.site.id,
            name: d.site.name || d.site.id,
            timezone: d.site.timezone || 'UTC'
        },
        period: state.customRange ? `${state.customRange.from} - ${state.customRange.to}` : d.period.label,
        filters: state.filters,
        saved_segments: state.savedSegments,
        compare_previous: state.compare,
        bounce_rate_ceiling: state.ceiling,
        visitor_floor: state.floor,
        results: {
            visitors: { value: d.kpi.visitors },
            pageviews: { value: d.kpi.pageviews },
            bounce_rate: { value: d.kpi.bounceRate },
            visit_duration: { value: d.kpi.avgDuration }
        },
        timeseries: d.trend.map((v, i) => ({ date: `bucket-${i}`, visitors: v })),
        breakdowns: {
            source: d.sources.map(r => ({ name: r.name, visitors: r.visitors })),
            page: d.pages.map(r => ({ name: r.name, visitors: r.visitors })),
            country: d.countries.map(r => ({ name: r.name, visitors: r.visitors }))
        },
        goals: d.goals,
        funnel: d.funnel,
        sites: SITE_IDS.map(id => {
            const added = state.addedSites.find(s => s.domain === id);
            return added ? { domain: added.domain, name: added.name, timezone: added.timezone } 
                         : { domain: id, name: id, timezone: 'UTC' };
        })
    };
    return JSON.stringify(obj, null, 2);
}

function importStatsJSON(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        if (parsed.schema_version !== 'plausible-stats-v1' || !parsed.results || !parsed.sites) {
            return false;
        }
        pushUndo();
        // Restore minimal viable state from JSON.
        // It's a complex hydration, we make a best effort to update state to reflect the import.

        // Sites: rebuild addedSites to exactly reflect the imported `sites` list
        // (drop stale user-added sites no longer present, add new ones) BEFORE
        // touching state.site, then sync the SITE_IDS registry via hydrateAddedSites
        // so the dashboard never silently falls back to example.com metrics.
        if (Array.isArray(parsed.sites)) {
            const importedNonSeeded = parsed.sites.filter((s) => s && typeof s.domain === 'string' && s.domain
                && typeof s.name === 'string' && !SEEDED_SITE_IDS.includes(s.domain));
            state.addedSites = importedNonSeeded.map((s) => ({
                domain: s.domain,
                name: s.name,
                timezone: typeof s.timezone === 'string' ? s.timezone : 'UTC',
            }));
        }
        // Guard against the imported site itself being omitted from `sites`.
        if (parsed.site && typeof parsed.site.domain === 'string' && parsed.site.domain
            && !SEEDED_SITE_IDS.includes(parsed.site.domain)
            && !state.addedSites.some((s) => s.domain === parsed.site.domain)) {
            state.addedSites.push({
                domain: parsed.site.domain,
                name: typeof parsed.site.name === 'string' ? parsed.site.name : parsed.site.domain,
                timezone: typeof parsed.site.timezone === 'string' ? parsed.site.timezone : 'UTC',
            });
        }
        hydrateAddedSites();
        if (parsed.site && typeof parsed.site.domain === 'string' && SITE_IDS.includes(parsed.site.domain)) {
            state.site = parsed.site.domain;
        }

        state.filters = Array.isArray(parsed.filters)
            ? parsed.filters.filter(f => f && DIMENSIONS.includes(f.dimension) && typeof f.value === 'string')
            : [];
        state.savedSegments = parsed.saved_segments || [];
        // Rebuild addedGoals to exactly reflect the imported `goals` array (same
        // replace-not-merge treatment as sites/filters) so a payload that omits
        // a previously session-added goal actually drops it instead of leaving
        // it stale alongside the imported set.
        if (Array.isArray(parsed.goals)) {
            const seededGoalNames = ['Signup', 'Pricing viewed', 'Docs read'];
            state.addedGoals = parsed.goals
                .filter((g) => g && typeof g.name === 'string' && !seededGoalNames.includes(g.name)
                    && typeof g.goal_type === 'string' && typeof g.match_key === 'string')
                .map((g) => ({ name: g.name, goal_type: g.goal_type, match_key: g.match_key }));
        } else {
            state.addedGoals = [];
        }
        state.compare = !!parsed.compare_previous;
        // Same integer/range validation loadState and the threshold inputs use —
        // reject out-of-range/non-integer imported values rather than trusting raw JSON numbers.
        state.ceiling = Number.isInteger(parsed.bounce_rate_ceiling) && parsed.bounce_rate_ceiling >= 0 && parsed.bounce_rate_ceiling <= 100
            ? parsed.bounce_rate_ceiling : defaultState.ceiling;
        state.floor = Number.isInteger(parsed.visitor_floor) && parsed.visitor_floor >= 0 && parsed.visitor_floor <= 1000000
            ? parsed.visitor_floor : defaultState.floor;

        // Since custom range period is complex, we just set a custom string if it doesn't match predefined.
        // Run it through the same validateCustomRange the Apply button enforces so
        // invalid/inverted imported ranges can't bypass that check.
        const isPreset = PERIODS.some(p => p.label === parsed.period);
        if (!isPreset && parsed.period) {
            const parts = parsed.period.split(' - ');
            const from = parts.length === 2 ? parts[0] : undefined;
            const to = parts.length === 2 ? parts[1] : undefined;
            if (parts.length === 2 && Object.keys(validateCustomRange(from, to)).length === 0) {
                state.period = 'custom';
                state.customRange = { from, to };
            } else {
                state.period = defaultState.period;
                state.customRange = null;
            }
        } else if (isPreset) {
            state.period = PERIODS.find(p => p.label === parsed.period).id;
            state.customRange = null;
        }

        commit();
        return true;
    } catch (e) {
        return false;
    }
}

function openExportDrawer() {
    closeAllModals();
    const opener = document.activeElement;
    let drawer = document.getElementById('export-drawer');
    
    if (drawer) { drawer.remove(); }
    
    const title = el('h2', { text: 'Export Report' });
    const closeBtn = el('button', { type: 'button', class: 'iconbtn drawer-close', text: '×' });

    let currentTab = 'json';
    const jsonPreview = el('pre', { class: 'preview-block', id: 'preview-json', text: generateStatsJSON() });
    
    const dashboardModel = computeDashboard(state.site, state.period, state.filters, state.sort, state.compare, state.addedGoals, state.customRange);
    const csvPreview = el('pre', { class: 'preview-block hidden', id: 'preview-csv', text: generateBreakdownCSV(dashboardModel) });

    const tabJsonBtn = el('button', { class: 'tab active', text: 'Stats JSON' });
    const tabCsvBtn = el('button', { class: 'tab', text: 'Breakdown CSV' });
    const tabs = el('div', { class: 'tabs' }, [tabJsonBtn, tabCsvBtn]);

    tabJsonBtn.addEventListener('click', () => {
        tabJsonBtn.classList.add('active');
        tabCsvBtn.classList.remove('active');
        jsonPreview.classList.remove('hidden');
        csvPreview.classList.add('hidden');
        currentTab = 'json';
    });

    tabCsvBtn.addEventListener('click', () => {
        tabCsvBtn.classList.add('active');
        tabJsonBtn.classList.remove('active');
        csvPreview.classList.remove('hidden');
        jsonPreview.classList.add('hidden');
        currentTab = 'csv';
    });

    const copyBtn = el('button', { class: 'btn', text: 'Copy' });
    const downloadBtn = el('button', { class: 'btn', text: 'Download' });

    copyBtn.addEventListener('click', () => {
        const text = currentTab === 'json' ? jsonPreview.textContent : csvPreview.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const toast = el('div', { class: 'toast', text: 'Copied to clipboard', role: 'status', 'aria-live': 'polite' });
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        });
    });
    
    downloadBtn.addEventListener('click', () => {
        const text = currentTab === 'json' ? jsonPreview.textContent : csvPreview.textContent;
        const blob = new Blob([text], { type: currentTab === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentTab === 'json' ? 'export.json' : 'export.csv';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Import functionality
    const importLabel = el('label', { for: 'import', text: 'Stats JSON' });
    const importInput = el('textarea', { id: 'import', class: 'import-input', placeholder: 'Paste Stats JSON here...', 'aria-describedby': 'err-import' });
    const importErr = el('div', { class: 'err-msg', id: 'err-import', role: 'alert' });
    const importBtn = el('button', { class: 'btn', text: 'Import' });

    importBtn.addEventListener('click', () => {
        const val = importInput.value.trim();
        if (importStatsJSON(val)) {
            importErr.textContent = '';
            drawer.classList.remove('active');
            if (opener) opener.focus();
            const toast = el('div', { class: 'toast', text: 'Import successful', role: 'status', 'aria-live': 'polite' });
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } else {
            importErr.textContent = 'Invalid or malformed Stats JSON';
        }
    });

    const actions = el('div', { class: 'export-actions' }, [copyBtn, downloadBtn]);
    const importSection = el('div', { class: 'import-section' }, [
        el('h3', { text: 'Import Report' }),
        importLabel, importInput, importErr, importBtn
    ]);

    drawer = el('div', { id: 'export-drawer', class: 'drawer active', role: 'dialog', 'aria-modal': 'true' }, [
        el('div', { class: 'drawer-content' }, [
            el('div', { class: 'drawer-header' }, [title, closeBtn]),
            tabs,
            jsonPreview,
            csvPreview,
            actions,
            importSection
        ])
    ]);

    closeBtn.addEventListener('click', () => {
        drawer.classList.remove('active');
        if (opener) opener.focus();
    });

    document.body.appendChild(drawer);
    trapFocus(drawer, closeBtn);
    setTimeout(() => copyBtn.focus(), 100);
}


// ---- WebMCP surface updates ----
// The existing TOOLS array needs to be updated with new tools, but it is defined near the bottom.
// We'll replace it entirely in the next step.
