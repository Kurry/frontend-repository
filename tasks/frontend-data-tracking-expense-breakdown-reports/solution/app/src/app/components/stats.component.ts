import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { NgxEchartsDirective } from 'ngx-echarts';
import { combineLatest } from 'rxjs';
import type { EChartsOption } from 'echarts';
import type { AppState } from '../core/model';
import { money, pct } from '../core/format';
import { selectSparklines, selectTotals } from '../store/app.selectors';

interface CardVm {
  label: string;
  value: string;
  sub: string;
  accent: string;
  spark: EChartsOption;
}

const REDUCED =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function sparkOption(data: number[], color: string): EChartsOption {
  return {
    animation: !REDUCED,
    grid: { left: 0, right: 0, top: 2, bottom: 0 },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: data.map((_, i) => i) },
    yAxis: { type: 'value', show: false, scale: true },
    tooltip: { show: false },
    series: [
      {
        type: 'line',
        data,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color },
        areaStyle: { color: `${color}26` },
      },
    ],
  } as EChartsOption;
}

@Component({
  selector: 'app-stats',
  imports: [NgxEchartsDirective],
  template: `
    <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary metrics">
      @for (card of cards; track card.label) {
        <article class="stat-card rounded-2xl border border-mint-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
          <div class="flex items-center justify-between gap-2">
            <div class="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">{{ card.label }}</div>
            <span class="h-2 w-2 rounded-full" [style.background]="card.accent" aria-hidden="true"></span>
          </div>
          <p class="font-display mt-1.5 text-[26px] font-bold leading-none tracking-tight tabular-nums text-teal-950"
            [class.!text-positive]="card.label === 'Total Income'">
            {{ card.value }}
          </p>
          <p class="mt-1 text-[11px] text-ink-soft">{{ card.sub }}</p>
          <div class="mt-2 h-9" echarts [options]="card.spark" aria-hidden="true"></div>
        </article>
      }
    </section>
  `,
})
export class StatsComponent implements OnInit {
  cards: CardVm[] = [];

  constructor(private store: Store<{ app: AppState }>) {}

  ngOnInit(): void {
    combineLatest([this.store.select(selectTotals), this.store.select(selectSparklines)]).subscribe(
      ([totals, sparks]) => {
        this.cards = [
        {
          label: 'Total Income',
          value: `+$${money(totals.income).slice(1)}`,
          sub: 'Salary + freelance inflows',
          accent: '#0E7C4A',
          spark: sparkOption(sparks.income, '#0E7C4A'),
        },
        {
          label: 'Total Expenses',
          value: money(totals.expenses),
          sub: 'Across all expense categories',
          accent: '#E0874B',
          spark: sparkOption(sparks.expense, '#E0874B'),
        },
        {
          label: 'Total Net Income',
          value: `${totals.net >= 0 ? '+' : '-'}$${money(totals.net).slice(1)}`,
          sub: 'Income minus expenses',
          accent: '#0F3D3E',
          spark: sparkOption(sparks.net, '#0F3D3E'),
        },
        {
          label: 'Savings Rate',
          value: totals.income > 0 ? pct(totals.savingsRate / 100) : '—',
          sub: 'Net divided by income',
          accent: '#7BC4B8',
          spark: sparkOption(sparks.savings, '#3E8E7E'),
        },
      ];
      },
    );
  }
}
