import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { EChartsOption } from 'echarts';
import { map } from 'rxjs';
import { selectBudgetSummary, selectBudgetsByCategory } from '../store/budget.selectors';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  summary$;
  budgetsByCategory$;
  chartOptions$;

  constructor(private store: Store) {
    this.summary$ = this.store.select(selectBudgetSummary);
    this.budgetsByCategory$ = this.store.select(selectBudgetsByCategory);
    this.chartOptions$ = this.budgetsByCategory$.pipe(map(rows => ({
      animationDurationUpdate: 350,
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ${c}'
      },
      legend: {
        bottom: 0,
        type: 'scroll'
      },
      series: [{
        name: 'Current period spending',
        type: 'pie',
        radius: ['38%', '68%'],
        center: ['50%', '43%'],
        data: rows
          .filter(row => row.currentExpenses > 0)
          .map(row => ({ name: row.name, value: Number(row.currentExpenses.toFixed(2)) })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      }]
    } satisfies EChartsOption)));
  }
}
