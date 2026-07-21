import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import type { AppState } from '../core/model';
import { TrapFocusDirective } from '../core/trap-focus.directive';
import * as A from '../store/app.actions';
import { selectConfirm } from '../store/app.selectors';

/**
 * Confirmation step for delete and bulk delete — accidental activation can
 * always be cancelled before the rows are removed.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [AsyncPipe, TrapFocusDirective],
  template: `
    @if (vm$ | async; as vm) {
      <div class="fixed inset-0 z-[70] flex items-center justify-center bg-teal-950/45 px-4" (click)="onScrim($event)">
        <div
          appTrapFocus
          (escapePressed)="cancel()"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          tabindex="-1"
          class="overlay-card w-full max-w-sm rounded-2xl border border-mint-200 bg-white p-6 shadow-2xl shadow-teal-950/25"
        >
          <div class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-danger-bg text-danger">
            <i class="pi pi-trash"></i>
          </div>
          <h2 id="confirm-title" class="font-display text-lg font-bold text-teal-950">
            {{ vm.kind === 'bulk' ? 'Delete ' + vm.count + ' transactions?' : 'Delete this transaction?' }}
          </h2>
          <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">
            {{ vm.summary }} This removes the {{ vm.count === 1 ? 'row' : 'rows' }} from the table, the summary
            strip, the charts, and the next export. You can cancel and keep everything as-is.
          </p>
          <div class="mt-5 flex justify-end gap-3">
            <button type="button" class="btn-secondary" (click)="cancel()">Cancel</button>
            <button type="button" class="btn-danger" data-autofocus (click)="confirmDelete()">
              {{ vm.kind === 'bulk' ? 'Delete ' + vm.count + ' transactions' : 'Delete transaction' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  vm$;

  constructor(private store: Store<{ app: AppState }>) {
    this.vm$ = this.store.select((s) => s.app).pipe(
      map((s) => {
        const confirm = s.confirm;
        if (!confirm) return null;
        const rows = s.transactions.filter((t) => confirm.ids.includes(t.id));
        const summary =
          confirm.kind === 'single' && rows[0]
            ? `${rows[0].payee} · ${rows[0].category} · ${rows[0].amount < 0 ? '-' : '+'}$${Math.abs(rows[0].amount).toFixed(2)}.`
            : `${rows.length} selected rows across the transactions list.`;
        return { kind: confirm.kind, ids: confirm.ids, count: confirm.ids.length, summary };
      }),
    );
  }

  confirmDelete(): void {
    let ids: string[] = [];
    this.store.select((s) => s.app.confirm).subscribe((c) => {
      ids = c?.ids ?? [];
    }).unsubscribe();
    this.store.dispatch(A.deleteTransactions({ ids }));
    this.store.dispatch(
      A.showToast({
        message: ids.length === 1 ? 'Transaction deleted' : `${ids.length} transactions deleted`,
        nonce: Date.now(),
      }),
    );
    this.store.dispatch(A.closeConfirm());
  }

  cancel(): void {
    this.store.dispatch(A.closeConfirm());
  }

  onScrim(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel();
  }
}
