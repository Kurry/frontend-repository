import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../store/app.state';
import { selectChartMode, selectDrawerOpen, selectCommandPaletteOpen } from '../../store/app.selectors';
import * as AppActions from '../../store/app.actions';
import { StatsComponent } from '../stats/stats.component';
import { TransactionListComponent } from '../transaction-list/transaction-list.component';
import { ChartBreakdownComponent } from '../chart-breakdown/chart-breakdown.component';
import { ChartTrendsComponent } from '../chart-trends/chart-trends.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, StatsComponent, TransactionListComponent, ChartBreakdownComponent, ChartTrendsComponent],
  templateUrl: './layout.component.html'
})
export class LayoutComponent implements OnInit {
  chartMode$: Observable<'breakdown' | 'trends'>;

  constructor(private store: Store<{ app: AppState }>) {
    this.chartMode$ = this.store.select(selectChartMode);
  }

  ngOnInit() {}

  setTab(mode: 'breakdown' | 'trends') {
    this.store.dispatch(AppActions.setChartMode({ mode }));
    this.store.dispatch(AppActions.showToast({ message: mode === 'breakdown' ? 'Breakdown view' : 'Trends view' }));
  }

  handleDemoClick(event: MouseEvent) {
    const target = (event.target as HTMLElement).closest<HTMLElement>('.inert-nav, [data-demo-action]');
    if (!target) return;
    const label = target.dataset['demoAction'] ?? target.getAttribute('aria-label') ?? target.textContent?.trim() ?? 'This control';
    this.store.dispatch(AppActions.showToast({ message: `${label} is unavailable in demo mode.` }));
  }

  openImport() {
    this.store.dispatch(AppActions.toggleCommandPalette({ open: true }));
  }

  openDrawer() {
    this.store.dispatch(AppActions.toggleDrawer({ open: true }));
  }
}
