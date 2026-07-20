import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { NgxEchartsModule, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { SankeyChart } from 'echarts/charts';
import { TooltipComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Observable, combineLatest, map } from 'rxjs';
import { AppState, Transaction } from '../../store/app.state';
import { selectFilteredTransactions } from '../../store/app.selectors';

echarts.use([SankeyChart, TooltipComponent, TitleComponent, CanvasRenderer]);

@Component({
  selector: 'app-chart-breakdown',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule, CurrencyPipe, DecimalPipe],
  providers: [
    provideEchartsCore({ echarts })
  ],
  templateUrl: './chart-breakdown.component.html'
})
export class ChartBreakdownComponent implements OnInit {
  options$: Observable<any>;
  legendData$: Observable<any[]>;

  constructor(private store: Store<{ app: AppState }>) {
    const txs$ = this.store.select(selectFilteredTransactions);
    
    this.options$ = txs$.pipe(
      map(txs => {
        const incomeTxs = txs.filter(t => t.income);
        const expenseTxs = txs.filter(t => !t.income);
        
        const totalIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
        
        const expenseCategories = Array.from(new Set(expenseTxs.map(t => t.category)));
        
        const nodes = [
          { name: 'Income Hub', itemStyle: { color: '#00cc88' } },
          { name: 'Net Income', itemStyle: { color: '#ccf0e6' } },
        ];
        
        incomeTxs.forEach(t => {
          if (!nodes.find(n => n.name === t.category)) nodes.push({ name: t.category, itemStyle: { color: '#00cc88' } });
        });
        
        expenseCategories.forEach((c, i) => {
          const colors = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
          nodes.push({ name: c, itemStyle: { color: colors[i % colors.length] } });
        });

        const links: any[] = [];
        
        incomeTxs.forEach(t => {
          links.push({ source: t.category, target: 'Income Hub', value: t.amount });
        });
        
        expenseCategories.forEach(c => {
          const catTotal = expenseTxs.filter(t => t.category === c).reduce((sum, t) => sum + t.amount, 0);
          links.push({ source: 'Income Hub', target: c, value: catTotal });
        });
        
        const net = totalIncome - totalExpense;
        if (net > 0) {
          links.push({ source: 'Income Hub', target: 'Net Income', value: net });
        }

        return {
          tooltip: {
            trigger: 'item',
            triggerOn: 'mousemove'
          },
          series: [
            {
              type: 'sankey',
              data: nodes,
              links: links,
              emphasis: {
                focus: 'adjacency'
              },
              lineStyle: {
                color: 'source',
                curveness: 0.5
              }
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
