import { NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { TrapFocusDirective } from '../core/trap-focus.directive';
import * as A from '../store/app.actions';

interface NavItem {
  label: string;
  icon: string;
  active?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'pi-th-large' },
  { label: 'Accounts', icon: 'pi-wallet' },
  { label: 'Transactions', icon: 'pi-arrows-h' },
  { label: 'Cash Flow', icon: 'pi-chart-line' },
  { label: 'Reports', icon: 'pi-file', active: true },
  { label: 'Budget', icon: 'pi-calculator' },
  { label: 'Recurring', icon: 'pi-refresh' },
  { label: 'Goals', icon: 'pi-flag' },
  { label: 'Investments', icon: 'pi-chart-pie' },
  { label: 'Forecasting', icon: 'pi-compass' },
  { label: 'Advice', icon: 'pi-comments' },
];

@Component({
  selector: 'app-sidebar',
  imports: [TrapFocusDirective, NgTemplateOutlet],
  template: `
    <!-- Persistent desktop sidebar -->
    <aside class="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-mint-200 bg-mint-100/70 px-4 py-5 lg:flex">
      <ng-container *ngTemplateOutlet="brand" />
      <p class="eyebrow mt-5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Shared demo report</p>
      <div class="mt-2 flex gap-1.5 px-2">
        <span class="chip">Demo mode</span>
        <span class="chip">Sample data</span>
      </div>
      <nav class="mt-4 flex-1 space-y-0.5 overflow-y-auto" aria-label="Ledger sections">
        @for (item of navItems; track item.label) {
          <button
            type="button"
            (click)="onNav(item)"
            [attr.aria-current]="item.active ? 'page' : null"
            class="nav-item w-full"
            [class.nav-active]="item.active"
          >
            <i class="pi text-[15px]" [class]="item.icon"></i>
            <span>{{ item.label }}</span>
            @if (item.active) { <span class="ml-auto h-1.5 w-1.5 rounded-full bg-mint-500" aria-hidden="true"></span> }
          </button>
        }
      </nav>
      <div class="mt-3 flex items-center gap-3 rounded-xl border border-mint-200 bg-white/70 px-3 py-2.5">
        <span class="flex h-9 w-9 items-center justify-center rounded-full bg-teal-950 font-display text-xs font-bold text-mint-300" aria-hidden="true">AR</span>
        <span class="min-w-0">
          <span class="block truncate text-sm font-semibold text-teal-950">Alex Rivera</span>
          <span class="block truncate text-[11px] text-ink-soft">Product lead · Demo</span>
        </span>
      </div>
    </aside>

    <!-- Mobile slide-over navigation -->
    @if (mobileOpen) {
      <div class="fixed inset-0 z-50 bg-teal-950/45 lg:hidden" (click)="onScrim($event)">
        <aside
          appTrapFocus
          fallbackFocusId="mobile-nav-btn"
          (escapePressed)="mobileOpen = false"
          role="dialog"
          aria-modal="true"
          aria-label="Ledger navigation"
          tabindex="-1"
          class="drawer-panel-left flex h-full w-72 flex-col border-r border-mint-200 bg-mint-50 px-4 py-5"
        >
          <div class="flex items-start justify-between">
            <ng-container *ngTemplateOutlet="brand" />
            <button type="button" (click)="mobileOpen = false" aria-label="Close navigation"
              class="flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft hover:bg-mint-100 focus-ring">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <p class="eyebrow mt-4 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Shared demo report</p>
          <div class="mt-2 flex gap-1.5 px-2">
            <span class="chip">Demo mode</span>
            <span class="chip">Sample data</span>
          </div>
          <nav class="mt-4 flex-1 space-y-0.5 overflow-y-auto" aria-label="Ledger sections">
            @for (item of navItems; track item.label) {
              <button type="button" (click)="onNav(item)" [attr.aria-current]="item.active ? 'page' : null"
                class="nav-item w-full min-h-11" [class.nav-active]="item.active">
                <i class="pi text-[15px]" [class]="item.icon"></i>
                <span>{{ item.label }}</span>
              </button>
            }
          </nav>
          <div class="mt-3 flex items-center gap-3 rounded-xl border border-mint-200 bg-white px-3 py-2.5">
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-teal-950 font-display text-xs font-bold text-mint-300" aria-hidden="true">AR</span>
            <span class="min-w-0">
              <span class="block truncate text-sm font-semibold text-teal-950">Alex Rivera</span>
              <span class="block truncate text-[11px] text-ink-soft">Product lead · Demo</span>
            </span>
          </div>
        </aside>
      </div>
    }

    <ng-template #brand>
      <div class="flex items-center gap-2.5 px-1">
        <span class="brand-mark" aria-hidden="true">
          <span class="brand-bar brand-bar-1"></span>
          <span class="brand-bar brand-bar-2"></span>
          <span class="brand-bar brand-bar-3"></span>
        </span>
        <span class="font-display text-lg font-bold tracking-tight text-teal-950">Ledger</span>
      </div>
    </ng-template>
  `,
})
export class SidebarComponent {
  readonly navItems = NAV_ITEMS;
  mobileOpen = false;

  constructor(private store: Store) {}

  onNav(item: NavItem): void {
    if (item.active) {
      this.mobileOpen = false;
      return;
    }
    this.store.dispatch(
      A.showToast({ message: `${item.label} is a demo area — only Reports is wired in this shell`, nonce: Date.now() }),
    );
  }

  onScrim(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.mobileOpen = false;
  }
}
