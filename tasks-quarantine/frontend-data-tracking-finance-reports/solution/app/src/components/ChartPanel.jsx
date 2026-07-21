import { useEffect, useRef } from 'preact/hooks';
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  LinearScale,
  CategoryScale,
} from 'chart.js';
import { SankeyController, Flow } from 'chartjs-chart-sankey';
import { chartTabMode, setChartTab, filteredTransactions, displayCurrency, totals } from '../state.js';
import { CATEGORY_META, EXPENSE_CATEGORIES, incomeSourceName } from '../schemas.js';
import { formatMoney } from '../format.js';
import { Icon } from './Icon.jsx';

Chart.register(ArcElement, Tooltip, Legend, DoughnutController, LinearScale, CategoryScale, SankeyController, Flow);

const INCOME_HUB = 'Income';
const NET_NODE = 'Net Income';

function expenseTotals(rows) {
  const map = new Map();
  EXPENSE_CATEGORIES.forEach((c) => map.set(c, 0));
  rows.forEach((t) => {
    if (t.amount < 0 && map.has(t.category)) map.set(t.category, map.get(t.category) + Math.abs(t.amount));
  });
  return map;
}

function incomeTotals(rows) {
  const map = new Map();
  rows.forEach((t) => {
    if (t.amount > 0) {
      const key = incomeSourceName(t.category);
      map.set(key, (map.get(key) || 0) + t.amount);
    }
  });
  return map;
}

function buildSankey(rows, cur) {
  const inc = incomeTotals(rows);
  const exp = expenseTotals(rows);
  const totalIncome = [...inc.values()].reduce((a, b) => a + b, 0);
  const totalExpense = [...exp.values()].reduce((a, b) => a + b, 0);
  const net = Math.max(0, totalIncome - totalExpense);
  const data = [];
  const labels = {};
  const colors = {};
  let incomeIdx = 0;
  const incomePalette = ['#6366f1', '#10b981', '#0ea5e9', '#a855f7'];
  inc.forEach((amt, name) => {
    if (amt <= 0) return;
    const id = `src:${name}`;
    data.push({ from: id, to: INCOME_HUB, flow: Math.round(amt * 100) / 100 });
    labels[id] = `${name} ${formatMoney(amt, cur)}`;
    colors[id] = incomePalette[incomeIdx % incomePalette.length];
    incomeIdx++;
  });
  colors[INCOME_HUB] = '#0f3d3e';
  labels[INCOME_HUB] = `Income ${formatMoney(totalIncome, cur)}`;
  colors[NET_NODE] = '#22c79a';
  labels[NET_NODE] = `Net Income ${formatMoney(net, cur)}`;
  if (net > 0) data.push({ from: INCOME_HUB, to: NET_NODE, flow: Math.round(net * 100) / 100 });
  exp.forEach((amt, cat) => {
    if (amt <= 0) return;
    const id = `exp:${cat}`;
    data.push({ from: INCOME_HUB, to: id, flow: Math.round(amt * 100) / 100 });
    labels[id] = `${CATEGORY_META[cat].emoji} ${CATEGORY_META[cat].label} ${formatMoney(amt, cur)}`;
    colors[id] = CATEGORY_META[cat].color;
  });
  return { data, labels, colors, totalIncome, totalExpense };
}

function Sankey({ cur }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const rows = filteredTransactions.value;
  const { data, labels, colors, totalIncome } = buildSankey(rows, cur);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }
    const ctx = canvasRef.current.getContext('2d');
    const cfg = {
      type: 'sankey',
      data: {
        datasets: [
          {
            data,
            labels,
            colorFrom: (c) => colors[c.from] || '#94a3b8',
            colorTo: (c) => colors[c.to] || '#94a3b8',
            color: (c) => colors[c.id] || '#94a3b8',
            size: 'max',
            nodeWidth: 12,
            borderCapStyle: 'round',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 350 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => {
                const r = c.raw || {};
                return `${r.from || ''} → ${r.to || ''}: ${formatMoney(r.flow || 0, cur)}`;
              },
            },
          },
        },
      },
    };
    chartRef.current = new Chart(ctx, cfg);
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [rows, cur]);

  if (totalIncome <= 0) {
    return (
      <div class="grid h-[300px] place-items-center text-sm text-[#7e958f]">
        No income flows to display in the Breakdown view yet.
      </div>
    );
  }

  return (
    <div class="flex flex-col gap-3 lg:flex-row">
      <div class="relative h-[300px] min-h-[300px] flex-1">
        <canvas ref={canvasRef} role="img" aria-label="Income flow sankey: income sources feed the Income hub, which splits into Net Income and each expense category" />
      </div>
      <SankeyLegend cur={cur} />
    </div>
  );
}

function SankeyLegend({ cur }) {
  const rows = filteredTransactions.value;
  const inc = incomeTotals(rows);
  const exp = expenseTotals(rows);
  return (
    <div class="w-full shrink-0 lg:w-56">
      <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#7e958f]">Income sources</p>
      <ul class="mb-3 space-y-1 text-xs">
        {[...inc.entries()].map(([name, amt]) => (
          <li key={name} class="flex items-center justify-between gap-2">
            <span class="flex items-center gap-1.5 text-[#4a6460]">
              <span class="h-2.5 w-2.5 rounded-sm" style={{ background: '#6366f1' }} />
              {name}
            </span>
            <span class="tnum font-medium text-[#0f3d3e]">{formatMoney(amt, cur)}</span>
          </li>
        ))}
      </ul>
      <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#7e958f]">Spending by category</p>
      <ul class="space-y-1 text-xs">
        {[...exp.entries()].filter(([, a]) => a > 0).map(([cat, amt]) => (
          <li key={cat} class="flex items-center justify-between gap-2">
            <span class="flex items-center gap-1.5 text-[#4a6460]">
              <span class="h-2.5 w-2.5 rounded-sm" style={{ background: CATEGORY_META[cat].color }} />
              {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
            </span>
            <span class="tnum font-medium text-[#0f3d3e]">{formatMoney(amt, cur)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Doughnut({ cur }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const rows = filteredTransactions.value;
  const exp = expenseTotals(rows);
  const entries = [...exp.entries()].filter(([, a]) => a > 0);
  const total = entries.reduce((a, [, v]) => a + v, 0);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }
    const ctx = canvasRef.current.getContext('2d');
    const cfg = {
      type: 'doughnut',
      data: {
        labels: entries.map(([c]) => `${CATEGORY_META[c].emoji} ${CATEGORY_META[c].label}`),
        datasets: [
          {
            data: entries.map(([, v]) => Math.round(v * 100) / 100),
            backgroundColor: entries.map(([c]) => CATEGORY_META[c].color),
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        animation: { duration: 350 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => {
                const pct = total > 0 ? ((c.parsed / total) * 100).toFixed(1) : '0.0';
                return ` ${c.label}: ${formatMoney(c.parsed, cur)} (${pct}%)`;
              },
            },
          },
        },
      },
    };
    chartRef.current = new Chart(ctx, cfg);
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [rows, cur]);

  if (total <= 0) {
    return (
      <div class="grid h-[300px] place-items-center text-sm text-[#7e958f]">
        No spending to chart yet — add an expense transaction to populate Trends.
      </div>
    );
  }

  return (
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div class="relative h-[260px] min-h-[260px] flex-1">
        <canvas ref={canvasRef} role="img" aria-label="Spending by category doughnut chart" />
      </div>
      <ul class="w-full space-y-1.5 text-xs lg:w-60">
        {entries.map(([cat, amt]) => {
          const pct = total > 0 ? (amt / total) * 100 : 0;
          return (
            <li key={cat} class="flex items-center justify-between gap-2 rounded-lg px-2 py-1 transition hover:bg-[#f2faf7]">
              <span class="flex items-center gap-2 text-[#4a6460]">
                <span class="h-3 w-3 rounded-sm" style={{ background: CATEGORY_META[cat].color }} />
                {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
              </span>
              <span class="flex items-center gap-2">
                <span class="tnum text-[#7e958f]">{pct.toFixed(1)}%</span>
                <span class="tnum font-semibold text-[#0f3d3e]">{formatMoney(amt, cur)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ChartPanel() {
  const tab = chartTabMode.value;
  const cur = displayCurrency.value;
  void totals.value;
  return (
    <section id="ld-chart" aria-labelledby="ld-chart-title" class="rounded-2xl border border-[#e3efe9] bg-white p-4 shadow-sm">
      <header class="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="ld-chart-title" class="font-display text-lg font-semibold text-[#0f3d3e]">
            Category & group analysis
          </h2>
          <p class="text-xs text-[#7e958f]">By category &amp; group · live from the ledger</p>
        </div>
        <div role="tablist" aria-label="Chart view" class="inline-flex rounded-full bg-[#e6f7f1] p-1">
          {[
            { id: 'breakdown', label: 'Breakdown' },
            { id: 'trends', label: 'Trends' },
          ].map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={tab === p.id}
              class={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                tab === p.id ? 'bg-[#0f3d3e] text-white shadow-sm' : 'text-[#175250] hover:text-[#0f3d3e]'
              }`}
              onClick={() => setChartTab(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>
      <div role="tabpanel" aria-label={tab === 'breakdown' ? 'Breakdown sankey' : 'Trends doughnut'}>
        {tab === 'breakdown' ? <Sankey cur={cur} /> : <Doughnut cur={cur} />}
      </div>
    </section>
  );
}
