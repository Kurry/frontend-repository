import { Component, computed, effect, inject, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectToastMessage } from '../../store/note.selectors';
import { clearToast } from '../../store/note.actions';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @if (message()) {
      <div class="toast" role="status" aria-live="polite">
        <span class="toast-icon" aria-hidden="true">{{ icon() }}</span>
        {{ message() }}
      </div>
    }
  `,
  styles: [`
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1e1e1e;
      color: #9be7a0;
      border: 1px solid #4f9f58;
      border-radius: 10px;
      padding: 12px 20px;
      font-size: 14px;
      font-family: 'Roboto', sans-serif;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 9999;
      animation: toast-in 0.2s ease both;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      pointer-events: none;
    }
    @keyframes toast-in {
      from { transform: translateY(12px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .toast-icon { font-size: 16px; }
  `]
})
export class ToastComponent implements OnDestroy {
  private store = inject(Store);
  private timer?: ReturnType<typeof setTimeout>;

  message = toSignal(this.store.select(selectToastMessage), { initialValue: null });
  icon = computed(() =>
    this.message()?.toLowerCase().includes('delet') ? '🗑' :
    this.message()?.toLowerCase().includes('creat') || this.message()?.toLowerCase().includes('new') ? '✨' :
    '✓'
  );

  constructor() {
    effect(() => {
      const msg = this.message();
      if (this.timer) clearTimeout(this.timer);
      if (msg) {
        this.timer = setTimeout(() => this.store.dispatch(clearToast()), 2800);
      }
    });
  }

  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }
}
