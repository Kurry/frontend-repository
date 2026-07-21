import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import type { AppState } from '../core/model';

interface CoachStep {
  targetId: string;
  title: string;
  body: string;
  anchor: 'left' | 'right';
}

/** First-run guided coachmarks over Export report and the burn-rate panel. */
@Component({
  selector: 'app-coachmarks',
  imports: [],
  template: `
    @if (active && step) {
      <div class="pointer-events-none fixed inset-0 z-40" aria-live="polite">
        @if (ring; as r) {
          <div
            class="coach-ring pointer-events-none absolute rounded-xl"
            [style.top.px]="r.top"
            [style.left.px]="r.left"
            [style.width.px]="r.width"
            [style.height.px]="r.height"
          ></div>
        }
        <div
          class="coach-card pointer-events-auto absolute w-72 rounded-xl border border-mint-200 bg-white p-4 shadow-xl shadow-teal-950/20"
          [style.top.px]="cardPos.top"
          [style.left.px]="cardPos.left"
          role="dialog"
          aria-label="Guided tour"
        >
          <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-mint-600">
            Guided tour · {{ index + 1 }} of {{ steps.length }}
          </p>
          <h2 class="font-display mt-1 text-sm font-bold text-teal-950">{{ step.title }}</h2>
          <p class="mt-1 text-xs leading-relaxed text-ink-soft">{{ step.body }}</p>
          <div class="mt-3 flex items-center justify-between">
            <button type="button" class="text-xs font-medium text-ink-soft underline decoration-mint-300 underline-offset-2 hover:text-teal-950 focus-ring rounded"
              (click)="dismiss()">Skip tour</button>
            <button type="button" class="btn-primary !px-3 !py-1.5 !text-xs" (click)="next()">
              {{ index + 1 === steps.length ? 'Done' : 'Next' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CoachmarksComponent implements OnInit {
  readonly steps: CoachStep[] = [
    {
      targetId: 'export-report-btn',
      title: 'Export report',
      body: 'Compile a live JSON or Markdown breakdown of the current filter scope. Every create, edit, delete, and import is reflected instantly.',
      anchor: 'left',
    },
    {
      targetId: 'burn-rate-panel',
      title: 'Burn-rate panel',
      body: 'Daily expense bars are tracked against your editable monthly ceiling, with a projected month-end spend and over-burn warnings.',
      anchor: 'right',
    },
  ];

  active = false;
  index = 0;
  ring: { top: number; left: number; width: number; height: number } | null = null;
  cardPos = { top: 80, left: 80 };

  constructor(
    private store: Store<{ app: AppState }>,
    @Inject(DOCUMENT) private doc: Document,
  ) {}

  get step(): CoachStep | null {
    return this.steps[this.index] ?? null;
  }

  ngOnInit(): void {
    this.store.select((s) => s.app.transactions.length).subscribe((len) => (this.seedLen = len)).unsubscribe();
    setTimeout(() => {
      this.active = true;
      this.position();
    }, 900);
    // Any real interaction ends the tour so it never blocks a workflow.
    this.doc.addEventListener('pointerdown', this.onPointerDown, true);
    this.store.select((s) => s.app.transactions.length).subscribe((len) => {
      if (this.active && len !== this.seedLen) this.dismiss();
    });
    this.store.select((s) => s.app.drawerOpen).subscribe((o) => o && this.dismiss());
    this.store.select((s) => s.app.importOpen).subscribe((o) => o && this.dismiss());
    this.store.select((s) => s.app.paletteOpen).subscribe((o) => o && this.dismiss());
  }

  private seedLen = 0;

  private onPointerDown = (event: PointerEvent) => {
    const target = event.target as HTMLElement | null;
    if (this.active && target && !target.closest('.coach-card')) this.dismiss();
  };

  private position(): void {
    const step = this.step;
    if (!step) return;
    const el = this.doc.getElementById(step.targetId);
    if (!el) {
      this.dismiss();
      return;
    }
    const rect = el.getBoundingClientRect();
    this.ring = { top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 };
    const vw = this.doc.defaultView?.innerWidth ?? 1200;
    if (step.anchor === 'left') {
      this.cardPos = { top: rect.bottom + 14, left: Math.max(16, Math.min(rect.right - 288, vw - 304)) };
    } else {
      this.cardPos = { top: rect.top + 8, left: Math.max(16, Math.min(rect.right + 16, vw - 304)) };
    }
  }

  next(): void {
    if (this.index + 1 >= this.steps.length) {
      this.dismiss();
      return;
    }
    this.index += 1;
    this.position();
  }

  dismiss(): void {
    if (!this.active) return;
    this.active = false;
    this.doc.removeEventListener('pointerdown', this.onPointerDown, true);
  }
}
