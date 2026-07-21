import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ACCOUNTS, CATEGORIES, INCOME_CATEGORIES, STATUSES } from '../core/model';
import type { AppState, TxStatus } from '../core/model';
import { toTransaction, validateTransaction } from '../core/contract';
import type { FieldError, FieldKey, RawTx } from '../core/contract';
import { todayIso } from '../core/format';
import { TrapFocusDirective } from '../core/trap-focus.directive';
import * as A from '../store/app.actions';

/**
 * Create/edit transaction modal. Native select controls, per-field inline
 * errors named by field, submit disabled until the field contract passes, and
 * a guard so double-activating submit creates exactly one transaction.
 */
@Component({
  selector: 'app-tx-dialog',
  imports: [ReactiveFormsModule, TrapFocusDirective],
  template: `
    @if (open) {
    <div class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-teal-950/45 px-4 py-10 sm:py-16" (click)="onScrim($event)">
      <div
        appTrapFocus
        (escapePressed)="close()"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="dialogId"
        tabindex="-1"
        class="overlay-card w-full max-w-lg rounded-2xl border border-mint-200 bg-white p-6 shadow-2xl shadow-teal-950/25"
      >
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <p class="eyebrow text-[11px] font-semibold uppercase tracking-[0.14em] text-mint-600">Ledger · Reports</p>
            <h2 [id]="dialogId" class="font-display text-xl font-bold text-teal-950">
              {{ mode === 'edit' ? 'Edit transaction' : 'New transaction' }}
            </h2>
          </div>
          <button type="button" (click)="close()" aria-label="Close dialog"
            class="flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-mint-100 hover:text-teal-950 focus-ring">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="field block">
              <span class="field-label">Date</span>
              <input formControlName="date" type="date" data-autofocus aria-describedby="date-hint"
                class="field-input" [class.field-invalid]="error('date')" />
              <span id="date-hint" class="field-hint">ISO calendar date</span>
              @if (error('date'); as msg) { <span class="field-error" role="note">{{ msg }}</span> }
            </label>

            <label class="field block">
              <span class="field-label">Payee</span>
              <input formControlName="payee" type="text" maxlength="80" aria-describedby="payee-hint"
                class="field-input" [class.field-invalid]="error('payee')" />
              <span id="payee-hint" class="field-hint">1–80 characters</span>
              @if (error('payee'); as msg) { <span class="field-error" role="note">{{ msg }}</span> }
            </label>

            <label class="field block">
              <span class="field-label">Category</span>
              <select formControlName="category" class="field-input" [class.field-invalid]="error('category')">
                <option value="" disabled>Choose a category</option>
                @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
              </select>
              <span class="field-hint">{{ categoryHint }}</span>
              @if (error('category'); as msg) { <span class="field-error" role="note">{{ msg }}</span> }
            </label>

            <label class="field block">
              <span class="field-label">Account</span>
              <select formControlName="account" class="field-input" [class.field-invalid]="error('account')">
                <option value="" disabled>Choose an account</option>
                @for (a of accounts; track a) { <option [value]="a">{{ a }}</option> }
              </select>
              @if (error('account'); as msg) { <span class="field-error" role="note">{{ msg }}</span> }
            </label>

            <label class="field block">
              <span class="field-label">Amount</span>
              <input formControlName="amount" type="text" inputmode="decimal" aria-describedby="amount-hint"
                class="field-input font-medium" [class.field-invalid]="error('amount')" />
              <span id="amount-hint" class="field-hint">{{ amountHint }}</span>
              @if (error('amount'); as msg) { <span class="field-error" role="note">{{ msg }}</span> }
            </label>

            <label class="field block">
              <span class="field-label">Status <span class="font-normal normal-case text-ink-soft">(optional)</span></span>
              <select formControlName="status" class="field-input" [class.field-invalid]="error('status')">
                <option value="">No status</option>
                @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
              </select>
              @if (error('status'); as msg) { <span class="field-error" role="note">{{ msg }}</span> }
            </label>
          </div>

          <div class="sr-only" aria-live="polite">{{ liveSummary }}</div>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button type="button" (click)="close()"
              class="btn-secondary">Cancel</button>
            <button type="submit"
              class="btn-primary" [attr.aria-disabled]="!canSubmit">
              {{ mode === 'edit' ? 'Save changes' : 'Create transaction' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    }
  `,
})
export class TxDialogComponent implements OnInit {
  readonly categories = [...CATEGORIES];
  readonly accounts = [...ACCOUNTS];
  readonly statuses = [...STATUSES];
  dialogId = 'tx-dialog-title';

  mode: 'create' | 'edit' = 'create';
  editId: string | null = null;
  open = false;
  submitting = false;
  errors: FieldError[] = [];

  form;

  constructor(
    fb: FormBuilder,
    private store: Store<{ app: AppState }>,
  ) {
    this.form = fb.group({
      date: [todayIso(), Validators.required],
      payee: ['', Validators.required],
      category: ['Groceries', Validators.required],
      account: ['Checking', Validators.required],
      amount: ['', Validators.required],
      status: [''],
    });
  }

  ngOnInit(): void {
    this.store.select((s) => s.app.dialog).subscribe((dialog) => {
      this.open = dialog !== null;
      if (!dialog) return;
      this.mode = dialog.mode;
      this.editId = dialog.id;
      this.submitting = false;
      this.resetForm(dialog);
    });
    this.form.valueChanges.subscribe(() => this.revalidate());
    this.revalidate();
  }

  private resetForm(dialog: { mode: 'create' | 'edit'; id: string | null; prefill: Record<string, string> | null }): void {
    let base: Record<string, string> = {
      date: todayIso(),
      payee: '',
      category: 'Groceries',
      account: 'Checking',
      amount: '',
      status: '',
    };
    if (dialog.mode === 'edit' && dialog.id) {
      // Synchronous read of the record being edited.
      let tx: { date: string; payee: string; category: string; account: string; amount: number; status?: TxStatus } | undefined;
      this.store.select((s) => s.app.transactions).subscribe((all) => {
        tx = all.find((t) => t.id === dialog.id);
      }).unsubscribe();
      if (tx) {
        base = {
          date: tx.date,
          payee: tx.payee,
          category: tx.category,
          account: tx.account,
          amount: String(tx.amount),
          status: tx.status ?? '',
        };
      }
    }
    if (dialog.prefill) base = { ...base, ...dialog.prefill };
    this.form.reset(base);
    this.revalidate();
  }

  private rawFromForm(): RawTx {
    const v = this.form.value;
    const amountStr = String(v.amount ?? '').trim();
    return {
      date: String(v.date ?? ''),
      payee: String(v.payee ?? ''),
      category: String(v.category ?? ''),
      account: String(v.account ?? ''),
      amount: amountStr === '' ? null : Number(amountStr.replace(/[$,\s]/g, '').replace(/[−–]/g, '-')),
      status: (v.status ?? '') as TxStatus | '',
    };
  }

  private revalidate(): void {
    this.errors = validateTransaction(this.rawFromForm());
  }

  error(field: FieldKey): string | null {
    return this.errors.find((e) => e.field === field)?.message ?? null;
  }

  get canSubmit(): boolean {
    return this.errors.length === 0 && !this.submitting;
  }

  get liveSummary(): string {
    return this.errors.length ? `Validation: ${this.errors.map((e) => e.message).join('. ')}` : 'All fields valid.';
  }

  get categoryHint(): string {
    const cat = this.form.value.category ?? '';
    if (INCOME_CATEGORIES.includes(cat)) return `${cat} is an income category`;
    return cat ? `${cat} is an expense category` : 'Closed ledger category set';
  }

  get amountHint(): string {
    const cat = this.form.value.category ?? '';
    if (INCOME_CATEGORIES.includes(cat)) return `Positive amount for ${cat || 'income'}`;
    return `Negative amount for ${cat || 'expenses'}, e.g. -42.50`;
  }

  onSubmit(): void {
    if (this.submitting) return;
    this.revalidate();
    if (!this.canSubmit) return;
    this.submitting = true;

    const raw = this.rawFromForm();
    let existing: { id: string } | undefined;
    if (this.mode === 'edit' && this.editId) {
      this.store.select((s) => s.app.transactions).subscribe((all) => {
        existing = all.find((t) => t.id === this.editId);
      }).unsubscribe();
    }
    const tx = toTransaction(raw, existing as never);
    if (this.mode === 'edit' && existing) {
      this.store.dispatch(A.updateTransaction({ transaction: tx }));
      this.store.dispatch(A.showToast({ message: `Transaction updated for ${tx.payee}`, nonce: Date.now() }));
    } else {
      this.store.dispatch(A.createTransaction({ transaction: tx }));
      this.store.dispatch(A.showToast({ message: `Transaction created for ${tx.payee}`, nonce: Date.now() }));
    }
    this.store.dispatch(A.flashCategory({ category: tx.category, nonce: Date.now() }));
    this.store.dispatch(A.closeDialog());
  }

  onScrim(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  close(): void {
    this.store.dispatch(A.closeDialog());
  }
}
