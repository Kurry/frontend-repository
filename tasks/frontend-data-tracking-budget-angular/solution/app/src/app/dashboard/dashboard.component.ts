import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectBudgetSummary, selectBudgetsByCategory } from '../store/budget.selectors';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  summary$;
  budgetsByCategory$;

  constructor(private store: Store) {
    this.summary$ = this.store.select(selectBudgetSummary);
    this.budgetsByCategory$ = this.store.select(selectBudgetsByCategory);
  }
}
