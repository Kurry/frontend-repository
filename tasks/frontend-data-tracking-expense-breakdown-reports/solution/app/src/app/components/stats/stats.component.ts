import { Component } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectTotals } from '../../store/app.selectors';
import { AppState } from '../../store/app.state';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe],
  template: `
    <section class="stats" aria-label="Summary metrics">
      <article class="stat-card">
        <p class="stat-label">Total Income</p>
        <p class="stat-value">{{ (totals$ | async)?.income | currency:'USD':'symbol':'1.2-2' }}</p>
      </article>
      <article class="stat-card">
        <p class="stat-label">Total Expenses</p>
        <p class="stat-value">{{ (totals$ | async)?.expenses | currency:'USD':'symbol':'1.2-2' }}</p>
      </article>
      <article class="stat-card">
        <p class="stat-label">Total Net Income</p>
        <p class="stat-value">{{ (totals$ | async)?.net | currency:'USD':'symbol':'1.2-2' }}</p>
      </article>
      <article class="stat-card">
        <p class="stat-label">Savings Rate</p>
        <p class="stat-value" *ngIf="(totals$ | async) as totals">
           {{ totals.income > 0 ? (totals.net / totals.income * 100 | number:'1.1-2') + '%' : '0%' }}
        </p>
      </article>
    </section>
  `
})
export class StatsComponent {
  totals$: Observable<any>;
  constructor(private store: Store<{ app: AppState }>) {
    this.totals$ = this.store.select(selectTotals);
  }
}
