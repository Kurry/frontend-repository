import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import * as A from '../store/app.actions';
import { selectToast } from '../store/app.selectors';

interface ToastVm {
  message: string;
  nonce: number;
  leaving: boolean;
}

/** Demo toast: enters from below, holds ~1.6s, exits. Same language for Copied. */
@Component({
  selector: 'app-toast-host',
  imports: [],
  template: `
    <div class="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex justify-center px-4" aria-live="polite" role="status">
      @if (vm; as toast) {
        <div
          class="toast-card flex items-center gap-2.5 rounded-xl border border-mint-200 bg-teal-950 px-4 py-2.5 text-sm font-medium text-mint-50 shadow-lg shadow-teal-950/20"
          [class.toast-leave]="toast.leaving"
        >
          <span class="toast-dot inline-block h-2 w-2 rounded-full bg-mint-400"></span>
          {{ toast.message }}
        </div>
      }
    </div>
  `,
})
export class ToastHostComponent implements OnInit, OnDestroy {
  vm: ToastVm | null = null;
  private destroy$ = new Subject<void>();
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.store
      .select(selectToast)
      .pipe(takeUntil(this.destroy$))
      .subscribe((toast) => {
        if (!toast) {
          return;
        }
        if (this.vm && this.vm.nonce === toast.nonce) return;
        this.clearTimers();
        this.vm = { message: toast.message, nonce: toast.nonce, leaving: false };
        this.hideTimer = setTimeout(() => {
          if (this.vm) this.vm = { ...this.vm, leaving: true };
          this.clearTimer = setTimeout(() => {
            this.vm = null;
            this.store.dispatch(A.hideToast());
          }, 240);
        }, 1600);
      });
  }

  private clearTimers(): void {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    if (this.clearTimer) clearTimeout(this.clearTimer);
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
