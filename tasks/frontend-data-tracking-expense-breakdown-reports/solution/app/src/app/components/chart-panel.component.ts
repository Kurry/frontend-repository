import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { NgxEchartsDirective } from 'ngx-echarts';
import { combineLatest } from 'rxjs';
import type { AppState } from '../core/model';
import { categoryColor } from '../core/model';
import { money, pct, signedMoney } from '../core/format';
import type { computeCategoryBreakdown } from '../core/report';
import * as A from '../store/app.actions';
import {
  selectCategoryBreakdown,
  selectChartMode,
  selectDrill,
  selectFlash,
  selectIncomeSources,
} from '../store/app.selectors';

type Breakdown = ReturnType<typeof computeCategoryBreakdown>;

const REDUCED =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Breakdown / Trends chart card. The pill toggle swaps panels in place with a
 * short transition; legends are plain text (amount + share) and recompute live
 * from the filtered collection; the last-activity line under each legend row
 * echoes the newest transaction amount in that category.
 */
@Component({
  selector: 'app-chart-panel',
  imports: [NgxEchartsDirective],
  template: `
    <section id="chart-panel" class="rounded-2xl border border-mint-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-lg font-bold text-teal-950">Expense breakdown</h2>
          <p class="text-xs text-ink-soft">
            {{ mode === 'breakdown' ? 'Income sources flowing into the Income hub, split to Net Income and expense categories.' : 'Expense categories as a share of total expenses for the current scope.' }}
          </p>
        </div>
        <div class="flex rounded-full border border-mint-200 bg-mint-50 p-1" role="tablist" aria-label="Chart mode">
          <button type="button" role="tab" [attr.aria-selected]="mode === 'breakdown'" (click)="switchMode('breakdown')"
            class="chart-pill" [class.chart-pill-active]="mode === 'breakdown'">Breakdown</button>
          <button type="button" role="tab" [attr.aria-selected]="mode === 'trends'" (click)="switchMode('trends')"
            class="chart-pill" [class.chart-pill-active]="mode === 'trends'">Trends</button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_260px]">
        <div class="relative">
          <div class="panel-swap" [attr.data-mode]="mode">
            @if (mode === 'breakdown') {
              <div class="h-[340px] w-full" echarts [options]="sankeyOptions" (chartInit)="onSankeyInit($event)"></div>
            } @else {
              <div class="h-[340px] w-full" echarts [options]="pieOptions"></div>
            }
          </div>
          @if (breakdown.length === 0) {
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p class="rounded-xl border border-mint-200 bg-mint-50 px-4 py-2.5 text-sm text-ink-soft">
                No expense data for the current scope — create a transaction to populate this chart.
              </p>
            </div>
          }
        </div>

        <aside aria-label="Chart legend">
          <h3 class="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
            {{ mode === 'breakdown' ? 'Flow legend · expense categories' : 'Trends legend · expense categories' }}
          </h3>
          @if (breakdown.length === 0) {
            <p class="text-xs text-ink-soft">Nothing to summarize yet.</p>
          }
          <ul class="space-y-1.5">
            @for (row of breakdown; track row.category) {
              <li
                class="legend-row rounded-xl border border-transparent px-2.5 py-2 transition-colors"
                [class.legend-flash]="flashCategory === row.category"
                [class.legend-dim]="drill !== null && drill.category !== row.category"
              >
                <div class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 shrink-0 rounded-sm" [style.background]="color(row.category)" aria-hidden="true"></span>
                  <span class="text-sm font-semibold text-teal-950">{{ row.category }}</span>
                  <span class="text-[11px] text-ink-soft">· {{ row.count }} txn{{ row.count === 1 ? '' : 's' }}</span>
                  <span class="ml-auto font-display text-sm font-bold tabular-nums text-teal-950">{{ money(row.amount) }}</span>
                  <span class="w-12 text-right text-[11px] tabular-nums text-ink-soft">{{ pct(row.share) }}</span>
                </div>
                <p class="mt-0.5 pl-[18px] text-[11px] text-ink-soft">
                  Last: {{ row.last.payee }} <span class="tabular-nums font-medium text-ink">{{ signedMoney(row.last.amount) }}</span>
                </p>
              </li>
            }
          </ul>
        </aside>
      </div>

      @if (drill; as d) {
        <div class="drill-card mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3">
          <span class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-sm" [style.background]="color(d.category)" aria-hidden="true"></span>
            <span class="font-display text-sm font-bold text-teal-950">{{ d.category }} drill-down</span>
          </span>
          <span class="text-sm text-ink"><strong>{{ money(d.amount) }}</strong> · {{ pct(d.share) }} of expenses · {{ d.count }} transactions</span>
          <span class="text-sm text-ink-soft">Top: {{ d.top }}</span>
          <button type="button" class="ml-auto text-xs font-semibold text-teal-950 underline decoration-mint-400 underline-offset-2 hover:text-mint-600 focus-ring rounded"
            (click)="clearDrill()">Clear focus</button>
        </div>
      }
    </section>
  `,
})
export class ChartPanelComponent implements OnInit {
  mode: 'breakdown' | 'trends' = 'breakdown';
  breakdown: Breakdown = [];
  drill: (Breakdown[number] & { top: string }) | null = null;
  flashCategory: string | null = null;
  sankeyOptions: any = {};
  pieOptions: any = {};

  private sankeyChart: any = null;
  private incomeSources: { category: string; amount: number }[] = [];
  private net = 0;

  constructor(private store: Store<{ app: AppState }>) {}

  ngOnInit(): void {
    this.store.select(selectChartMode).subscribe((m) => (this.mode = m));
    this.store.select(selectFlash).subscribe((f) => {
      this.flashCategory = f?.category ?? null;
      if (f) setTimeout(() => (this.flashCategory = null), 1600);
    });
    combineLatest([
      this.store.select(selectCategoryBreakdown),
      this.store.select(selectIncomeSources),
      this.store.select((s) => s.app.transactions),
      this.store.select((s) => s.app.filters),
      this.store.select(selectDrill),
    ]).subscribe(([breakdown, sources, txs, filters, drillKey]) => {
      this.breakdown = breakdown;
      this.incomeSources = sources;
      const income = txs.filter((t) => this.scopeMatches(t, filters) && t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expenses = breakdown.reduce((s, b) => s + b.amount, 0);
      this.net = income - expenses;
      this.rebuildSankey(drillKey, breakdown);
      this.rebuildPie(breakdown);
      this.drill = drillKey ? this.drillVm(drillKey) : null;
    });
  }

  private scopeMatches(t: AppState['transactions'][number], filters: AppState['filters']): boolean {
    if (filters.category && t.category !== filters.category) return false;
    if (filters.type === 'income' && t.amount <= 0) return false;
    if (filters.type === 'expense' && t.amount >= 0) return false;
    if (filters.dateStart && t.date < filters.dateStart) return false;
    if (filters.dateEnd && t.date > filters.dateEnd) return false;
    if (filters.payee && !t.payee.toLowerCase().includes(filters.payee.toLowerCase())) return false;
    return true;
  }

  private drillVm(category: string): (Breakdown[number] & { top: string }) | null {
    const row = this.breakdown.find((b) => b.category === category);
    if (!row) return null;
    let topTx: { payee: string; amount: number } | null = null;
    let all: AppState['transactions'] = [];
    this.store.select((s) => s.app.transactions).subscribe((t) => (all = t)).unsubscribe();
    for (const t of all) {
      if (t.category === category && t.amount < 0 && (!topTx || Math.abs(t.amount) > Math.abs(topTx.amount))) {
        topTx = { payee: t.payee, amount: t.amount };
      }
    }
    return { ...row, top: topTx ? `${topTx.payee} ${signedMoney(topTx.amount)}` : '—' };
  }

  color = categoryColor;
  money = money;
  pct = pct;
  signedMoney = signedMoney;

  switchMode(mode: 'breakdown' | 'trends'): void {
    if (this.mode === mode) return;
    this.store.dispatch(A.setChartMode({ mode }));
    this.store.dispatch(
      A.showToast({ message: mode === 'breakdown' ? 'Showing Breakdown view' : 'Showing Trends view', nonce: Date.now() }),
    );
  }

  clearDrill(): void {
    this.store.dispatch(A.setDrill({ category: null }));
  }

  onSankeyInit(chart: any): void {
    this.sankeyChart = chart;
    chart.on('click', (params: any) => {
      if (params?.dataType === 'node') {
        const name = String(params.name);
        if (this.breakdown.some((b) => b.category === name)) {
          this.store.dispatch(A.setDrill({ category: this.drill?.category === name ? null : name }));
        }
      }
    });
    chart.getZr().on('click', (event: any) => {
      if (!event.target && this.drill) this.store.dispatch(A.setDrill({ category: null }));
    });
  }

  private rebuildSankey(drillKey: string | null, breakdown: Breakdown): void {
    const sources = this.incomeSources;
    const incomeTotal = sources.reduce((s, x) => s + x.amount, 0);
    if (sources.length === 0 || breakdown.length === 0) {
      this.sankeyOptions = { animation: false, series: [] };
      return;
    }
    const dimmed = (name: string) =>
      drillKey !== null && name !== drillKey && name !== 'Income' && !sources.some((s) => s.category === name);
    const nodes = [
      ...sources.map((s) => ({
        name: s.category,
        itemStyle: { color: categoryColor(s.category), opacity: drillKey ? 0.3 : 1 },
      })),
      { name: 'Income', itemStyle: { color: '#14514F' } },
      ...(this.net > 0 ? [{ name: 'Net Income', itemStyle: { color: '#7BC4B8', opacity: drillKey ? 0.3 : 1 } }] : []),
      ...breakdown.map((b) => ({
        name: b.category,
        itemStyle: { color: categoryColor(b.category), opacity: dimmed(b.category) ? 0.22 : 1 },
      })),
    ];
    const links = [
      ...sources.map((s) => ({ source: s.category, target: 'Income', value: Math.max(s.amount, 0.01) })),
      ...(this.net > 0 ? [{ source: 'Income', target: 'Net Income', value: Math.max(this.net, 0.01) }] : []),
      ...breakdown.map((b) => ({ source: 'Income', target: b.category, value: Math.max(b.amount, 0.01) })),
    ];
    this.sankeyOptions = {
      animation: !REDUCED,
      animationDuration: 400,
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0F3D3E',
        borderColor: '#0F3D3E',
        textStyle: { color: '#F3FAF7', fontSize: 12 },
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const value = params.value as number;
            return `<strong>${params.name}</strong><br/>${money(value)}`;
          }
          return `${params.data.source} → ${params.data.target}<br/>${money(params.data.value)}`;
        },
      },
      series: [
        {
          type: 'sankey',
          left: 4,
          right: 130,
          top: 10,
          bottom: 10,
          nodeWidth: 14,
          nodeGap: 12,
          layoutIterations: 32,
          emphasis: { focus: 'adjacency' },
          data: nodes,
          links,
          label: {
            color: '#1C3331',
            fontSize: 11,
            fontWeight: 600,
            formatter: (params: any) => `${params.name}  ${money(params.value)}`,
          },
          lineStyle: { color: 'gradient', opacity: 0.35, curveness: 0.55 },
          cursor: 'pointer',
        },
      ],
    };
  }

  private rebuildPie(breakdown: Breakdown): void {
    const total = breakdown.reduce((s, b) => s + b.amount, 0);
    this.pieOptions = {
      animation: !REDUCED,
      animationDuration: 450,
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0F3D3E',
        borderColor: '#0F3D3E',
        textStyle: { color: '#F3FAF7', fontSize: 12 },
        formatter: (params: any) => {
          const value = params.value as number;
          const share = total > 0 ? value / total : 0;
          return `<strong>${params.name}</strong><br/>${money(value)} · ${pct(share)} of expenses`;
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['52%', '78%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: '#ffffff', borderWidth: 2 },
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 8,
            itemStyle: { shadowBlur: 14, shadowColor: 'rgba(15, 61, 62, 0.28)' },
          },
          cursor: 'pointer',
          data: breakdown.map((b) => ({
            name: b.category,
            value: b.amount,
            itemStyle: { color: categoryColor(b.category) },
          })),
        },
      ],
    };
  }
}
