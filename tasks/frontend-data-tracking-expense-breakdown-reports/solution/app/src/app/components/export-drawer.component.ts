import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import type { AppState } from '../core/model';
import { buildJsonReport, buildMarkdownReport } from '../core/report';
import { TrapFocusDirective } from '../core/trap-focus.directive';
import * as A from '../store/app.actions';
import { selectBurnRate, selectFilteredTransactions, selectFilters } from '../store/app.selectors';

/**
 * Export report drawer. JSON and Markdown tabs compile live from the shared
 * store — every create/edit/delete/import is reflected the moment it happens.
 */
@Component({
  selector: 'app-export-drawer',
  imports: [TrapFocusDirective],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex justify-end bg-teal-950/45" (click)="onScrim($event)">
        <aside
          appTrapFocus
          fallbackFocusId="export-report-btn"
          (escapePressed)="close()"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
          tabindex="-1"
          class="drawer-panel flex h-full w-full max-w-xl flex-col border-l border-mint-200 bg-white shadow-2xl shadow-teal-950/30"
        >
          <header class="flex items-start justify-between gap-4 border-b border-mint-100 px-6 py-4">
            <div>
              <p class="eyebrow text-[11px] font-semibold uppercase tracking-[0.14em] text-mint-600">Shared demo report</p>
              <h2 id="drawer-title" class="font-display text-lg font-bold text-teal-950">Export report</h2>
              <p class="mt-0.5 text-xs text-ink-soft">Compiled live from the session store — {{ count }} transactions in scope.</p>
            </div>
            <button type="button" (click)="close()" aria-label="Close export drawer"
              class="flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-mint-100 hover:text-teal-950 focus-ring">
              <i class="pi pi-times"></i>
            </button>
          </header>

          <div class="flex items-center gap-2 border-b border-mint-100 px-6 pt-3" role="tablist" aria-label="Export format">
            <button type="button" role="tab" [attr.aria-selected]="tab === 'markdown'" (click)="setTab('markdown')"
              class="tab-btn" [class.tab-active]="tab === 'markdown'">Markdown</button>
            <button type="button" role="tab" [attr.aria-selected]="tab === 'json'" (click)="setTab('json')"
              class="tab-btn" [class.tab-active]="tab === 'json'">JSON</button>
            <span class="ml-auto pb-1 text-[11px] text-ink-soft">Updates live with every mutation</span>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto bg-mint-50 px-6 py-4">
            <pre class="print-area whitespace-pre-wrap break-words rounded-xl border border-mint-100 bg-white p-4 font-mono text-[12px] leading-relaxed text-ink"
              [class.report-prose]="tab === 'markdown'">{{ text }}</pre>
          </div>

          <footer class="flex flex-wrap items-center gap-3 border-t border-mint-100 px-6 py-4">
            @if (tab === 'markdown') {
              <button type="button" class="btn-primary" (click)="download('markdown')">
                <i class="pi pi-download mr-1.5 text-xs"></i>Download Markdown
              </button>
            } @else {
              <button type="button" class="btn-primary" (click)="download('json')">
                <i class="pi pi-download mr-1.5 text-xs"></i>Download JSON
              </button>
            }
            <button type="button" class="btn-secondary copy-btn" [class.copied]="copied" (click)="copy()">
              @if (copied) {
                <i class="pi pi-check mr-1.5 text-xs"></i>Copied
              } @else {
                <i class="pi pi-copy mr-1.5 text-xs"></i>Copy
              }
            </button>
            <span class="ml-auto text-[11px] text-ink-soft">
              {{ tab === 'markdown' ? 'expense-breakdown-report.md' : 'expense-breakdown-report.json' }}
            </span>
          </footer>
        </aside>
      </div>
    }
  `,
})
export class ExportDrawerComponent implements OnInit, OnDestroy {
  open = false;
  tab: 'markdown' | 'json' = 'markdown';
  text = '';
  count = 0;
  copied = false;

  private destroy$ = new Subject<void>();
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private store: Store<{ app: AppState }>) {}

  ngOnInit(): void {
    this.store.select((s) => s.app.drawerOpen).pipe(takeUntil(this.destroy$)).subscribe((open) => {
      this.open = open;
      if (open) this.copied = false;
    });
    this.store.select((s) => s.app.drawerTab).pipe(takeUntil(this.destroy$)).subscribe((tab) => (this.tab = tab));
    combineLatest([
      this.store.select(selectFilteredTransactions),
      this.store.select(selectFilters),
      this.store.select(selectBurnRate),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([txs, filters, burn]) => {
        const input = {
          transactions: txs,
          filters,
          burn: { ceiling: burn.ceiling, monthToDate: burn.monthToDate, projectedMonthEnd: burn.projectedMonthEnd, over: burn.over },
        };
        this.count = input.transactions.length;
        this.text = this.tab === 'json' ? buildJsonReport(input) : buildMarkdownReport(input);
      });
  }

  setTab(tab: 'markdown' | 'json'): void {
    this.store.dispatch(A.openDrawer({ tab }));
  }

  download(format: 'markdown' | 'json'): void {
    const filename = format === 'markdown' ? 'expense-breakdown-report.md' : 'expense-breakdown-report.json';
    const mime = format === 'markdown' ? 'text/markdown' : 'application/json';
    const blob = new Blob([this.text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    this.store.dispatch(A.showToast({ message: `Downloading ${filename}`, nonce: Date.now() }));
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = this.text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(ta);
      }
    }
    this.copied = true;
    this.store.dispatch(A.showToast({ message: 'Copied to clipboard', nonce: Date.now() }));
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => (this.copied = false), 2800);
  }

  close(): void {
    this.store.dispatch(A.closeDrawer());
  }

  onScrim(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  ngOnDestroy(): void {
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
