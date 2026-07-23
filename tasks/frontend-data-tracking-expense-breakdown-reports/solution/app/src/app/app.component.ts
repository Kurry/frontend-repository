import { Component, HostListener, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import type { AppState } from './core/model';
import { monthLabel } from './core/format';
import { WebmcpService } from './services/webmcp.service';
import * as A from './store/app.actions';
import { SidebarComponent } from './components/sidebar.component';
import { StatsComponent } from './components/stats.component';
import { ChartPanelComponent } from './components/chart-panel.component';
import { BurnRateComponent } from './components/burn-rate.component';
import { TransactionsComponent } from './components/transactions.component';
import { TxDialogComponent } from './components/tx-dialog.component';
import { ConfirmDialogComponent } from './components/confirm-dialog.component';
import { ExportDrawerComponent } from './components/export-drawer.component';
import { CommandPaletteComponent } from './components/command-palette.component';
import { ImportPanelComponent } from './components/import-panel.component';
import { ToastHostComponent } from './components/toast-host.component';
import { CoachmarksComponent } from './components/coachmarks.component';

@Component({
  selector: 'app-root',
  imports: [
    SidebarComponent,
    StatsComponent,
    ChartPanelComponent,
    BurnRateComponent,
    TransactionsComponent,
    TxDialogComponent,
    ConfirmDialogComponent,
    ExportDrawerComponent,
    CommandPaletteComponent,
    ImportPanelComponent,
    ToastHostComponent,
    CoachmarksComponent,
  ],
  template: `
    <div class="flex min-h-screen bg-mint-50 text-ink">
      <app-sidebar #sidebarRef></app-sidebar>

      <div class="flex min-w-0 flex-1 flex-col">
        <!-- Mobile top bar -->
        <div class="sticky top-0 z-30 flex items-center gap-3 border-b border-mint-200 bg-mint-50/90 px-4 py-3 backdrop-blur lg:hidden">
          <button type="button" id="mobile-nav-btn" (click)="sidebarRef.mobileOpen = true"
            aria-label="Open navigation" [attr.aria-expanded]="sidebarRef.mobileOpen"
            class="flex h-11 w-11 items-center justify-center rounded-xl border border-mint-200 bg-white text-teal-950 focus-ring">
            <i class="pi pi-bars"></i>
          </button>
          <span class="brand-mark brand-mark-sm" aria-hidden="true">
            <span class="brand-bar brand-bar-1"></span>
            <span class="brand-bar brand-bar-2"></span>
            <span class="brand-bar brand-bar-3"></span>
          </span>
          <span class="font-display text-base font-bold text-teal-950">Ledger</span>
          <button type="button" (click)="openPalette()" aria-label="Open command palette"
            class="ml-auto flex h-11 w-11 items-center justify-center rounded-xl border border-mint-200 bg-white text-teal-950 focus-ring">
            <i class="pi pi-search"></i>
          </button>
        </div>

        <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <!-- Page chrome -->
          <header class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="eyebrow text-[11px] font-semibold uppercase tracking-[0.16em] text-mint-600">Shared demo report</p>
              <h1 class="font-display report-title text-[28px] font-bold leading-tight tracking-tight text-teal-950 sm:text-[32px]">
                Expense breakdown
              </h1>
              <p class="mt-1 text-sm text-ink-soft">{{ month }} · Alex Rivera · Demo mode with sample data</p>
            </div>
            <div class="hidden items-center gap-2 lg:flex">
              <button type="button" class="icon-btn" aria-label="Notifications (demo)" (click)="demo('Notifications are demo-only in this shell')">
                <i class="pi pi-bell"></i>
                <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-mint-500" aria-hidden="true"></span>
              </button>
              <button type="button" class="icon-btn" aria-label="Settings (demo)" (click)="demo('Settings are demo-only in this shell')">
                <i class="pi pi-cog"></i>
              </button>
              <button type="button" class="kbd-btn" (click)="openPalette()" aria-label="Open command palette">
                <i class="pi pi-search mr-1.5 text-xs"></i>Commands
                <kbd class="kbd ml-2">⌘K</kbd>
              </button>
            </div>
          </header>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" class="btn-ghost" (click)="demo('Filters are demo-only in this chrome — the real filters live above the transactions list')">
              <i class="pi pi-filter mr-1.5 text-xs"></i>Filters
            </button>
            <button type="button" class="btn-ghost" (click)="demo('Date is demo-only in this chrome — use the date range filter above the list')">
              <i class="pi pi-calendar mr-1.5 text-xs"></i>Date
            </button>
            <button type="button" class="btn-ghost" (click)="demo('Report saved to the demo session')">
              <i class="pi pi-save mr-1.5 text-xs"></i>Save
            </button>
            <span class="mx-1 hidden h-5 w-px bg-mint-200 sm:block" aria-hidden="true"></span>
            <button type="button" id="new-transaction-btn" class="btn-primary" (click)="newTransaction()">
              <i class="pi pi-plus mr-1.5 text-xs"></i>New transaction
            </button>
            <button type="button" id="export-report-btn" class="btn-secondary" (click)="exportReport()">
              <i class="pi pi-download mr-1.5 text-xs"></i>Export report
            </button>
            <button type="button" id="import-csv-btn" class="btn-secondary" (click)="importCsv()">
              <i class="pi pi-upload mr-1.5 text-xs"></i>Import CSV
            </button>
            <button type="button" class="btn-ghost" (click)="focusBurnRate()">
              <i class="pi pi-chart-bar mr-1.5 text-xs"></i>Burn rate
            </button>
          </div>

          <div class="mt-6 space-y-5">
            <app-stats />
            <app-chart-panel />
            <app-burn-rate />
            <app-transactions />
          </div>

          <footer class="mt-8 pb-4 text-center text-[11px] text-ink-soft">
            Ledger reports shell · synthetic demo data only · no outbound navigation
          </footer>
        </main>
      </div>

      <!-- Overlays -->
      <app-tx-dialog />
      <app-confirm-dialog />
      <app-export-drawer />
      <app-command-palette />
      <app-import-panel />
      <app-coachmarks />
      <app-toast-host />
    </div>
  `,
})
export class AppComponent implements OnInit {
  month = monthLabel();
  mobileNavOpen = false;

  constructor(
    private store: Store<{ app: AppState }>,
    private webmcp: WebmcpService,
  ) {}

  ngOnInit(): void {
    this.webmcp.register();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing =
      target !== null &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openPalette();
      return;
    }
    if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
    // Global shortcuts are active only when no overlay is open.
    let overlayOpen = false;
    this.store
      .select((s) => s.app.dialog !== null || s.app.paletteOpen || s.app.drawerOpen || s.app.importOpen || s.app.confirm !== null)
      .subscribe((v) => (overlayOpen = v))
      .unsubscribe();
    if (overlayOpen) return;
    switch (event.key.toLowerCase()) {
      case 'n':
        event.preventDefault();
        this.newTransaction();
        break;
      case 'e':
        event.preventDefault();
        this.exportReport();
        break;
      case 'i':
        event.preventDefault();
        this.importCsv();
        break;
      case 'b':
        this.store.dispatch(A.setChartMode({ mode: 'breakdown' }));
        this.store.dispatch(A.showToast({ message: 'Showing Breakdown view', nonce: Date.now() }));
        break;
      case 't':
        this.store.dispatch(A.setChartMode({ mode: 'trends' }));
        this.store.dispatch(A.showToast({ message: 'Showing Trends view', nonce: Date.now() }));
        break;
      case '/':
        event.preventDefault();
        document.getElementById('payee-search')?.focus();
        break;
    }
  }

  newTransaction(): void {
    this.store.dispatch(A.openDialog({ mode: 'create', id: null, prefill: null }));
  }

  exportReport(): void {
    this.store.dispatch(A.openDrawer({ tab: 'markdown' }));
  }

  importCsv(): void {
    this.store.dispatch(A.openImport());
  }

  openPalette(): void {
    this.store.dispatch(A.openPalette());
  }

  focusBurnRate(): void {
    document.getElementById('burn-rate-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    document.getElementById('ceiling-input')?.focus();
  }

  demo(message: string): void {
    this.store.dispatch(A.showToast({ message, nonce: Date.now() }));
  }
}
