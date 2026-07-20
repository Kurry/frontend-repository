import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { NgxEchartsModule, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Observable, map } from 'rxjs';
import { AppState, Transaction } from '../../store/app.state';
import { selectFilteredTransactions } from '../../store/app.selectors';

echarts.use([PieChart, TooltipComponent, TitleComponent, CanvasRenderer]);

@Component({
  selector: 'app-chart-trends',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule, CurrencyPipe, DecimalPipe],
  providers: [
    provideEchartsCore({ echarts })
  ],
  templateUrl: './chart-trends.component.html'
})
export class ChartTrendsComponent implements OnInit {
  options$: Observable<any>;
  legendData$: Observable<any[]>;

  constructor(private store: Store<{ app: AppState }>) {
    const txs$ = this.store.select(selectFilteredTransactions);

    this.options$ = txs$.pipe(
      map(txs => {
        const expenseTxs = txs.filter(t => !t.income);
        const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
        const categories = Array.from(new Set(expenseTxs.map(t => t.category)));
        const colors = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
        
        const data = categories.map((c, i) => {
          const amt = expenseTxs.filter(t => t.category === c).reduce((sum, t) => sum + t.amount, 0);
          return {
            name: c,
            value: amt,
            itemStyle: { color: colors[i % colors.length] }
          };
        }).sort((a, b) => b.value - a.value);

        return {
          tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
              const val = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(params.value);
              const pct = totalExpense > 0 ? ((params.value / totalExpense) * 100).toFixed(2) : 0;
              return `${params.name}: ${val} (${pct}%)`;
            }
          },
          series: [
            {
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 5,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: false
              },
              data: data
            }
          ]
        };
      })
    );

    this.legendData$ = txs$.pipe(
      map(txs => {
        const expenseTxs = txs.filter(t => !t.income);
        const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
        const categories = Array.from(new Set(expenseTxs.map(t => t.category)));
        const colors = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
        return categories.map((c, i) => {
          const amt = expenseTxs.filter(t => t.category === c).reduce((sum, t) => sum + t.amount, 0);
          return {
            name: c,
            amount: amt,
            percent: totalExpense > 0 ? (amt / totalExpense) * 100 : 0,
            color: colors[i % colors.length]
          };
        }).sort((a, b) => b.amount - a.amount);
      })
    );
  }

  ngOnInit() {}
}
