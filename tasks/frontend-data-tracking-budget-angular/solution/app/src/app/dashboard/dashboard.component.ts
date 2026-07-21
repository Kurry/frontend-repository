import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { EChartsOption } from 'echarts';
import { map } from 'rxjs';
import { selectBudgetState, selectBudgetSummary, selectBudgetsByCategory } from '../store/budget.selectors';
import { selectPeriodExpensesTotal } from '../store/budget.selectors';

const CATEGORY_COLORS = ['#c2185b', '#7b1fa2', '#1976d2', '#00897b', '#f57c00', '#5d4037', '#455a64', '#d81b60'];

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  summary$;
  budgetsByCategory$;
  chartOptions$;
  delta$;
  daysLeftInMonth$;

  constructor(private store: Store) {
    this.summary$ = this.store.select(selectBudgetSummary);
    this.budgetsByCategory$ = this.store.select(selectBudgetsByCategory);
    this.chartOptions$ = this.budgetsByCategory$.pipe(map(rows => ({
      animationDuration: 400,
      animationDurationUpdate: 500,
      animationEasingUpdate: 'cubicInOut',
      color: CATEGORY_COLORS,
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => `${p.name}: $${Number(p.value).toFixed(2)}`,
      },
      legend: {
        bottom: 0,
        type: 'scroll',
        icon: 'circle',
      },
      series: [{
        name: 'Current period spending',
        type: 'pie',
        radius: ['38%', '68%'],
        center: ['50%', '43%'],
        avoidLabelOverlap: true,
        label: { show: false },
        data: rows
          .filter(row => row.currentExpenses > 0)
          .map(row => ({ name: row.name, value: Number(row.currentExpenses.toFixed(2)) })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
      }],
    } satisfies EChartsOption)));

    this.delta$ = this.store.select(selectBudgetState).pipe(map(state => {
      const current = selectPeriodExpensesTotal(state, state.period);
      const totalMonths = state.period.year * 12 + (state.period.month - 1) - 1;
      const prior = { year: Math.floor(totalMonths / 12), month: (totalMonths % 12) + 1 };
      const priorTotal = selectPeriodExpensesTotal(state, prior);
      return { priorTotal, delta: current - priorTotal, hasPrior: priorTotal > 0 };
    }));

    this.daysLeftInMonth$ = this.store.select(selectBudgetState).pipe(map(state => {
      const daysInMonth = new Date(state.period.year, state.period.month, 0).getDate();
      const now = new Date();
      const isCurrentMonth = state.period.year === now.getFullYear() && state.period.month === now.getMonth() + 1;
      const day = isCurrentMonth ? now.getDate() : daysInMonth;
      return Math.max(0, daysInMonth - day);
    }));
  }

  colorFor(index: number): string {
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  }

  overBy(row: { currentExpenses: number; maxExpenses: number }): number {
    return Math.max(0, row.currentExpenses - row.maxExpenses);
  }
}
