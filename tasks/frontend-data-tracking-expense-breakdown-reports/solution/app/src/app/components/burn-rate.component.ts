import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { AppState } from '../core/model';
import { money, monthLabel } from '../core/format';
import * as A from '../store/app.actions';
import { selectBurnRate } from '../store/app.selectors';

const REDUCED =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Monthly burn rate: daily expense bars against an editable ceiling, with a
 * cumulative pace line, a projected month-end annotation, and a peak-day
 * callout. Zero/negative ceilings are rejected inline; the prior ceiling
 * stays in effect.
 */
@Component({
  selector: 'app-burn-rate',
  imports: [NgxEchartsDirective],
  template: `
    <section
      id="burn-rate-panel"
      class="rounded-2xl border bg-white p-5 shadow-sm transition-colors"
      [class.border-danger]="over"
      [class.bg-danger-bg]="over"
      [class.border-mint-200]="!over"
      aria-label="Monthly burn rate"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="font-display text-lg font-bold text-teal-950">Burn rate · {{ month }}</h2>
          <p class="text-xs text-ink-soft">Daily expense totals against your monthly ceiling.</p>
        </div>
        <form class="flex items-end gap-2" (submit)="onCeilingSubmit($event)">
          <label class="field block">
            <span class="field-label">Monthly ceiling</span>
            <span class="flex items-center gap-0">
              <span class="flex h-10 items-center rounded-l-lg border border-r-0 border-mint-200 bg-mint-50 px-2.5 text-sm text-ink-soft">$</span>
              <input
                id="ceiling-input"
                type="number"
                step="0.01"
                min="0"
                inputmode="decimal"
                [value]="ceilingDraft"
                (input)="onCeilingInput($event)"
                aria-describedby="ceiling-hint"
                class="field-input !rounded-l-none !w-32"
                [class.field-invalid]="ceilingError !== null"
              />
            </span>
            @if (ceilingError) {
              <span id="ceiling-hint" class="field-error" role="note">{{ ceilingError }}</span>
            }
          </label>
          <button type="submit" class="btn-secondary mb-0.5" [disabled]="ceilingError !== null">Save</button>
        </form>
      </div>

      <div class="mt-3 h-[220px] w-full" echarts [options]="options"></div>

      <div class="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span class="text-ink">Month to date: <strong class="font-display tabular-nums">{{ money(mtd) }}</strong></span>
        <span class="text-ink">Projected month-end: <strong class="font-display tabular-nums">{{ money(projected) }}</strong></span>
        <span class="text-ink-soft">Pace: {{ money(pace) }}/day</span>
        @if (peak; as p) {
          <span class="text-ink-soft">Busiest day: {{ p.label }} ({{ money(p.amount) }})</span>
        }
        <span
          class="ml-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
          [class.bg-danger]="over"
          [class.text-white]="over"
          [class.bg-mint-100]="!over"
          [class.text-teal-950]="!over"
          role="status"
        >
          <i class="pi" [class.pi-exclamation-triangle]="over" [class.pi-check-circle]="!over"></i>
          @if (over) {
            Projected to exceed the ceiling by {{ money(overage) }}
          } @else {
            Under the ceiling by {{ money(ceiling - projected) }}
          }
        </span>
      </div>
    </section>
  `,
})
export class BurnRateComponent implements OnInit {
  month = monthLabel();
  ceiling = 0;
  ceilingDraft = '';
  ceilingError: string | null = null;
  mtd = 0;
  projected = 0;
  pace = 0;
  overage = 0;
  over = false;
  peak: { label: string; amount: number } | null = null;
  options: any = { series: [] };

  constructor(private store: Store<{ app: AppState }>) {}

  money = money;

  ngOnInit(): void {
    this.store.select(selectBurnRate).subscribe((burn) => {
      this.ceiling = burn.ceiling;
      if (this.ceilingError === null) this.ceilingDraft = String(burn.ceiling);
      this.mtd = burn.monthToDate;
      this.projected = burn.projectedMonthEnd;
      this.pace = burn.pace;
      this.overage = burn.overage;
      this.over = burn.over;
      this.peak = burn.peak;
      this.rebuild(burn.days.map((d) => d.amount), burn.days.map((d) => d.label), burn);
    });
  }

  onCeilingInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.ceilingDraft = raw;
    const n = Number(raw);
    if (raw.trim() === '' || Number.isNaN(n)) {
      this.ceilingError = 'Ceiling must be a positive number — the previous ceiling stays in effect.';
    } else if (n <= 0) {
      this.ceilingError = 'Ceiling must be greater than zero — the previous ceiling stays in effect.';
    } else {
      this.ceilingError = null;
    }
  }

  onCeilingSubmit(event: Event): void {
    event.preventDefault();
    if (this.ceilingError !== null) return;
    const n = Number(this.ceilingDraft);
    this.store.dispatch(A.setCeiling({ ceiling: n }));
    this.store.dispatch(A.showToast({ message: `Monthly ceiling set to ${money(n)}`, nonce: Date.now() }));
  }

  private rebuild(amounts: number[], labels: string[], burn: { ceiling: number; daysInMonth: number; today: number; projectedMonthEnd: number; peak: { day: number; amount: number } | null }): void {
    let cum = 0;
    const cumulative = amounts.map((a) => (cum += a));
    const dailyPaceCeiling = burn.ceiling / burn.daysInMonth;
    const annotation = burn.projectedMonthEnd > burn.ceiling
      ? `{over|Projected ${money(burn.projectedMonthEnd)} · over by ${money(burn.projectedMonthEnd - burn.ceiling)}}`
      : `{ok|Projected ${money(burn.projectedMonthEnd)} · under by ${money(burn.ceiling - burn.projectedMonthEnd)}}`;
    this.options = {
      animation: !REDUCED,
      animationDuration: 350,
      grid: { left: 46, right: 46, top: 26, bottom: 24 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0F3D3E',
        borderColor: '#0F3D3E',
        textStyle: { color: '#F3FAF7', fontSize: 12 },
        formatter: (params: any) => {
          const list = Array.isArray(params) ? params : [params];
          const day = list[0]?.axisValueLabel ?? '';
          const lines = list.map((p: any) =>
            p.seriesName === 'Daily spend'
              ? `${p.marker} ${day}: ${money(Number(p.value))}`
              : `${p.marker} Cumulative: ${money(Number(p.value))}`,
          );
          return lines.join('<br/>');
        },
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { color: '#5B7C76', fontSize: 10, interval: 4 },
        axisLine: { lineStyle: { color: '#CDE7DD' } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Daily',
          nameTextStyle: { color: '#5B7C76', fontSize: 10 },
          axisLabel: { color: '#5B7C76', fontSize: 10, formatter: (v: number) => `$${Math.round(v)}` },
          splitLine: { lineStyle: { color: '#E6F3EE' } },
        },
        {
          type: 'value',
          name: 'Cumulative',
          nameTextStyle: { color: '#5B7C76', fontSize: 10 },
          axisLabel: { color: '#5B7C76', fontSize: 10, formatter: (v: number) => `$${Math.round(v)}` },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Daily spend',
          type: 'bar',
          data: amounts.map((a, i) => ({
            value: a,
            itemStyle: { color: i + 1 === burn.today ? '#0F3D3E' : '#7BC4B8', borderRadius: [3, 3, 0, 0] },
          })),
          barMaxWidth: 16,
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                yAxis: dailyPaceCeiling,
                lineStyle: { color: '#B4232A', type: 'dashed', width: 1.5 },
                label: {
                  formatter: `Ceiling pace ${money(dailyPaceCeiling)}/day`,
                  color: '#B4232A',
                  fontSize: 10,
                  fontWeight: 700,
                },
              },
            ],
          },
          ...(burn.peak
            ? {
                markPoint: {
                  symbol: 'pin',
                  symbolSize: 34,
                  itemStyle: { color: '#0F3D3E' },
                  label: { color: '#fff', fontSize: 9, formatter: 'Peak' },
                  data: [{ coord: [burn.peak.day - 1, burn.peak.amount] }],
                },
              }
            : {}),
        },
        {
          name: 'Cumulative',
          type: 'line',
          yAxisIndex: 1,
          data: cumulative,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#14514F' },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                yAxis: burn.ceiling,
                lineStyle: { color: '#14514F', type: 'dotted', width: 1.5 },
                label: { formatter: `Ceiling ${money(burn.ceiling)}`, color: '#14514F', fontSize: 10, fontWeight: 700 },
              },
            ],
          },
          markPoint: {
            symbol: 'roundRect',
            symbolSize: [10, 10],
            data: [],
          },
        },
        {
          name: 'Projection',
          type: 'line',
          yAxisIndex: 1,
          data: [],
          markLine: {
            silent: true,
            symbol: 'none',
            animation: !REDUCED,
            data: [
              {
                yAxis: burn.projectedMonthEnd,
                lineStyle: { color: burn.projectedMonthEnd > burn.ceiling ? '#B4232A' : '#3E8E7E', type: 'dashed', width: 1.5 },
                label: {
                  formatter: annotation,
                  rich: {
                    over: { color: '#B4232A', fontSize: 10, fontWeight: 700 },
                    ok: { color: '#3E8E7E', fontSize: 10, fontWeight: 700 },
                  },
                },
              },
            ],
          },
        },
      ],
    };
  }
}
