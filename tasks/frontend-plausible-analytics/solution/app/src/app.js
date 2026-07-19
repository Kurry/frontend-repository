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
} from './data.js';

const STORAGE_KEY = 'plausible-analytics-state-v1';

// ---- shared client state (persisted to localStorage per source contract) ----
const defaultState = {
  site: 'example.com',
  period: 'last-30-days',
  sort: 'most-visitors',
  theme: 'light',
  filter: null, // { dimension, value }
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw);
    const s = { ...defaultState, ...parsed };
    if (!SITE_IDS.includes(s.site)) s.site = defaultState.site;
    if (!PERIODS.some((p) => p.id === s.period)) s.period = defaultState.period;
    if (!SORTS.some((p) => p.id === s.sort)) s.sort = defaultState.sort;
    if (s.theme !== 'light' && s.theme !== 'dark') s.theme = 'light';
    if (s.filter && (!DIMENSIONS.includes(s.filter.dimension) || typeof s.filter.value !== 'string')) {
      s.filter = null;
    }
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

// ---- state mutators (the ONE code path shared by UI + WebMCP) ---------------
function setSite(siteId) {
  if (!SITE_IDS.includes(siteId)) return false;
  state.site = siteId;
  state.filter = null; // switching site clears any stale segment filter
  commit();
  return true;
}

function setPeriod(periodId) {
  if (!PERIODS.some((p) => p.id === periodId)) return false;
  state.period = periodId;
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

function applyFilter(dimension, value) {
  if (!DIMENSIONS.includes(dimension)) return false;
  const key = dimension === 'source' ? 'sources' : dimension === 'page' ? 'pages' : 'countries';
  const exists = SITES[state.site][key].some((e) => e.name === value);
  if (!exists) return false;
  state.filter = { dimension, value }; // replacing a filter keeps only the latest
  commit();
  return true;
}

function clearFilter() {
  const had = !!state.filter;
  state.filter = null;
  commit();
  return had;
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
    const active = state.filter && state.filter.dimension === dim && state.filter.value === e.name;
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
    li.appendChild(btn);
    list.appendChild(li);
  }
  return el('section', { class: 'card panel' }, [el('h2', { text: title }), list]);
}

function render() {
  const model = computeDashboard(state.site, state.period, state.filter, state.sort);
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

  const controls = el('div', { class: 'controls' }, [
    el('div', { class: 'control' }, [el('label', { for: 'site-select', text: 'Site' }), siteSelect]),
    el('div', { class: 'control' }, [
      el('label', { for: 'period-select', text: 'Date range' }),
      periodSelect,
    ]),
    el('div', { class: 'control' }, [el('label', { for: 'sort-select', text: 'Sort' }), sortSelect]),
    el('div', { class: 'control' }, [
      el('label', { for: 'theme-toggle', text: 'Theme' }),
      themeBtn,
    ]),
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
  if (state.filter) {
    const pill = el('div', { class: 'pill' }, [
      el('span', { class: 'pill-dim', text: `${DIM_LABEL[state.filter.dimension]}:` }),
      el('span', { text: ` ${state.filter.value}` }),
      el('button', {
        type: 'button',
        'aria-label': `Clear ${DIM_LABEL[state.filter.dimension].toLowerCase()} filter`,
        onclick: () => clearFilter(),
        text: '×',
      }),
    ]);
    const clearBtn = el('button', {
      class: 'iconbtn clear-btn',
      id: 'clear-filter',
      type: 'button',
      'aria-label': 'Clear filter',
      onclick: () => clearFilter(),
    }, [el('span', { class: 'x', text: '×' }), el('span', { text: 'Clear filter' })]);
    nodes.push(el('div', { class: 'filterbar' }, [pill, clearBtn]));
  }

  // ---- main ----
  const kpiDefs = [
    ['Unique visitors', formatNumber(model.kpi.visitors)],
    ['Total pageviews', formatNumber(model.kpi.pageviews)],
    ['Bounce rate', `${model.kpi.bounceRate}%`],
    ['Visit duration', formatDuration(model.kpi.avgDuration)],
  ];
  const kpis = el(
    'div',
    { class: 'kpis' },
    kpiDefs.map(([label, value]) =>
      el('div', { class: 'card kpi' }, [
        el('div', { class: 'kpi-label', text: label }),
        el('div', { class: 'kpi-value', 'data-kpi': label, text: value }),
      ]),
    ),
  );

  const maxBar = Math.max(...model.trend, 1);
  const chart = el(
    'div',
    { class: 'chart', role: 'img', 'aria-label': `Visitors trend, ${model.trend.length} periods, peak ${formatNumber(maxBar)} visitors` },
    model.trend.map((v, i) =>
      el('div', { class: 'bar-wrap', title: `${formatNumber(v)} visitors` }, [
        el('div', { class: 'bar', style: `height:${Math.max(6, Math.round((v / maxBar) * 100))}%` }),
      ]),
    ),
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

  const main = el('main', {}, [kpis, chartCard, panels]);
  nodes.push(main);

  root.replaceChildren(...nodes);
}

// ---- WebMCP surface ---------------------------------------------------------
const TOOLS = [
  {
    name: 'browse_open',
    operation: 'open',
    description: 'Open the dashboard for one of the tracked sites.',
    parameters: { destination: { type: 'string', enum: SITE_IDS } },
    handler: (a) =>
      setSite(a.destination)
        ? { ok: true, site: state.site }
        : { ok: false, error: `Unknown destination: ${a && a.destination}` },
  },
  {
    name: 'browse_apply_filter',
    operation: 'apply_filter',
    description: 'Apply a bounded filter. dimension source/page/country segments the metrics; dimension period sets the date window.',
    parameters: {
      filter: { type: 'string', enum: ['source', 'page', 'country', 'period'] },
      value: { type: 'string' },
    },
    handler: (a) => {
      if (!a || !a.filter) return { ok: false, error: 'filter is required' };
      if (a.filter === 'period') {
        return setPeriod(a.value)
          ? { ok: true, period: state.period }
          : { ok: false, error: `Unknown period: ${a.value}` };
      }
      return applyFilter(a.filter, a.value)
        ? { ok: true, filter: state.filter }
        : { ok: false, error: `Unknown ${a.filter}: ${a.value}` };
    },
  },
  {
    name: 'browse_clear_filter',
    operation: 'clear_filter',
    description: 'Clear the active segment filter and return to the unfiltered dashboard.',
    parameters: {},
    handler: () => ({ ok: true, cleared: clearFilter(), filter: state.filter }),
  },
  {
    name: 'browse_sort',
    operation: 'sort',
    description: 'Sort the breakdown panels.',
    parameters: { sort: { type: 'string', enum: SORTS.map((s) => s.id) } },
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
    filter: state.filter,
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
