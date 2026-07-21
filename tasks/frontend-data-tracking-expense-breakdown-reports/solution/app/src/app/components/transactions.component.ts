import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { TagModule } from 'primeng/tag';
import autoAnimate from '@formkit/auto-animate';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { ACCOUNTS, CATEGORIES, categoryColor } from '../core/model';
import type { AppState, Filters, Transaction } from '../core/model';
import { fmtDate, money, signedMoney } from '../core/format';
import * as A from '../store/app.actions';
import { selectSummaryStrip, selectTotals, selectVisibleTransactions } from '../store/app.selectors';

type SortKey = 'date' | 'amount';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Transactions list mode: filter popovers + removable chips, sortable native
 * table with row enter/exit animations, bulk categorize/delete with a
 * confirmation step, and the summary strip below.
 */
@Component({
  selector: 'app-transactions',
  imports: [TagModule],
  template: `
    <section id="transactions-panel" class="rounded-2xl border border-mint-200 bg-white p-5 shadow-sm" aria-label="Transactions">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-lg font-bold text-teal-950">Transactions</h2>
          <p class="text-xs text-ink-soft">{{ visibleCount }} of {{ totalCount }} rows · filtered live from the shared collection</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn-ghost" (click)="demoToast('Sorting is available from the Date and Amount column headers')">
            <i class="pi pi-sort-alt mr-1.5 text-xs"></i>Sort
          </button>
          <button type="button" class="btn-ghost" (click)="demoToast('Column visibility is demo-only in this shell')">
            <i class="pi pi-table mr-1.5 text-xs"></i>Columns
          </button>
        </div>
      </div>

      <!-- Filter toolbar -->
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <div class="relative">
          <button type="button" id="category-filter-btn" class="filter-btn" [attr.aria-expanded]="menu === 'category'"
            (click)="toggleMenu('category')">
            <i class="pi pi-tag mr-1.5 text-xs text-mint-600"></i>
            {{ filters.category ?? 'All categories' }}
            <i class="pi pi-chevron-down ml-1.5 text-[10px] text-ink-soft"></i>
          </button>
          @if (menu === 'category') {
            <div class="filter-menu" role="listbox" aria-label="Category filter">
              <button type="button" role="option" [attr.aria-selected]="filters.category === null" class="filter-option"
                [class.filter-option-active]="filters.category === null" (click)="setCategory(null)">All categories</button>
              @for (c of categories; track c) {
                <button type="button" role="option" [attr.aria-selected]="filters.category === c" class="filter-option"
                  [class.filter-option-active]="filters.category === c" (click)="setCategory(c)">
                  <span class="h-2 w-2 rounded-sm" [style.background]="color(c)" aria-hidden="true"></span>{{ c }}
                </button>
              }
            </div>
          }
        </div>

        <div class="relative">
          <button type="button" class="filter-btn" [attr.aria-expanded]="menu === 'type'" (click)="toggleMenu('type')">
            <i class="pi pi-filter mr-1.5 text-xs text-mint-600"></i>
            {{ filters.type === 'income' ? 'Income' : filters.type === 'expense' ? 'Expenses' : 'All types' }}
            <i class="pi pi-chevron-down ml-1.5 text-[10px] text-ink-soft"></i>
          </button>
          @if (menu === 'type') {
            <div class="filter-menu" role="listbox" aria-label="Type filter">
              @for (opt of typeOptions; track opt.value) {
                <button type="button" role="option" [attr.aria-selected]="filters.type === opt.value" class="filter-option"
                  [class.filter-option-active]="filters.type === opt.value" (click)="setType(opt.value)">
                  {{ opt.label }}
                </button>
              }
            </div>
          }
        </div>

        <div class="flex items-center gap-1.5 rounded-lg border border-mint-200 bg-mint-50/60 px-2.5 py-1.5">
          <i class="pi pi-calendar text-xs text-mint-600" aria-hidden="true"></i>
          <label class="sr-only" for="date-start">Date range start</label>
          <input id="date-start" type="text" inputmode="numeric" [value]="dateStartDraft" (input)="onDateChange()"
            aria-describedby="date-range-hint" class="range-input" [class.field-invalid]="dateError" />
          <span class="text-xs text-ink-soft">→</span>
          <label class="sr-only" for="date-end">Date range end</label>
          <input id="date-end" type="text" inputmode="numeric" [value]="dateEndDraft" (input)="onDateChange()"
            class="range-input" [class.field-invalid]="dateError" />
        </div>

        <div class="relative min-w-44 flex-1 sm:max-w-60">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-soft" aria-hidden="true"></i>
          <label class="sr-only" for="payee-search">Search payees</label>
          <input id="payee-search" type="search" [value]="filters.payee ?? ''" (input)="onPayeeInput($event)"
            class="field-input !py-2 !pl-8 text-sm" />
        </div>
      </div>
      <p id="date-range-hint" class="mt-1.5 text-[11px] text-ink-soft">Date range uses ISO dates (YYYY-MM-DD) and is inclusive.</p>
      @if (dateError) {
        <p class="mt-1 text-xs font-medium text-danger-deep" role="note">{{ dateError }}</p>
      }

      <!-- Active filter chips -->
      @if (activeChips.length > 0) {
        <div class="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
          @for (chip of activeChips; track chip.key) {
            <span class="chip-active">
              {{ chip.label }}
              <button type="button" (click)="removeChip(chip.key)" [attr.aria-label]="'Remove filter ' + chip.label"
                class="ml-1 rounded-full p-0.5 transition-colors hover:bg-mint-300 focus-ring">
                <i class="pi pi-times text-[9px]"></i>
              </button>
            </span>
          }
          <button type="button" class="text-xs font-semibold text-teal-950 underline decoration-mint-400 underline-offset-2 hover:text-mint-600 focus-ring rounded"
            (click)="clearAll()">Clear all</button>
        </div>
      }

      <!-- Bulk action bar -->
      @if (selectionCount > 0) {
        <div class="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-mint-300 bg-mint-100/70 px-3.5 py-2.5">
          <span class="text-sm font-semibold text-teal-950">{{ selectionCount }} selected</span>
          <label class="flex items-center gap-1.5 text-xs text-ink-soft">
            <span class="sr-only">Bulk category</span>
            <select [value]="bulkCategory" (change)="bulkCategory = $any($event.target).value" class="field-input !w-auto !py-1.5 text-xs">
              <option value="">Set category…</option>
              @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
            </select>
          </label>
          <button type="button" class="btn-secondary !py-1.5 !text-xs" [disabled]="!bulkCategory" (click)="applyBulkCategorize()">
            Apply category
          </button>
          <span class="mx-1 hidden h-5 w-px bg-mint-300 sm:block" aria-hidden="true"></span>
          <button type="button" class="btn-danger-outline !py-1.5 !text-xs" (click)="bulkDelete()">
            <i class="pi pi-trash mr-1 text-[10px]"></i>Delete selected
          </button>
          <button type="button" class="ml-auto text-xs font-medium text-ink-soft underline decoration-mint-300 underline-offset-2 hover:text-teal-950 focus-ring rounded"
            (click)="clearSelection()">Clear selection</button>
        </div>
      }

      <!-- Table / card list -->
      <div class="mt-4">
        @if (rows.length === 0) {
          <div class="rounded-xl border border-dashed border-mint-300 bg-mint-50/60 px-6 py-12 text-center">
            <i class="pi pi-inbox text-2xl text-mint-500" aria-hidden="true"></i>
            @if (totalCount === 0) {
              <h3 class="font-display mt-3 text-base font-bold text-teal-950">No transactions yet</h3>
              <p class="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
                This list holds every Ledger entry for the report. Add your first one with
                <button type="button" class="font-semibold text-teal-950 underline decoration-mint-400 underline-offset-2 focus-ring rounded"
                  (click)="newTx()">New transaction</button>, or bring rows in via Import CSV.
              </p>
            } @else {
              <h3 class="font-display mt-3 text-base font-bold text-teal-950">No transactions match your filters</h3>
              <p class="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
                Widen the category, type, date range, or payee search — or clear everything to see the full list again.
              </p>
              <button type="button" class="btn-secondary mt-4" (click)="clearAll()">Clear filters</button>
            }
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="tx-table w-full text-left text-sm">
              <thead>
                <tr>
                  <th class="w-10">
                    <input type="checkbox" class="tx-check" [checked]="allSelected" (change)="toggleSelectAll()"
                      aria-label="Select all visible rows" />
                  </th>
                  <th>
                    <button type="button" class="sort-btn" [attr.aria-sort]="sort.key === 'date' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'"
                      (click)="sortBy('date')">
                      Date
                      @if (sort.key === 'date') { <i class="pi text-[9px]" [class.pi-arrow-up]="sort.dir === 'asc'" [class.pi-arrow-down]="sort.dir === 'desc'"></i> }
                    </button>
                  </th>
                  <th>Payee</th>
                  <th>Category</th>
                  <th class="hidden md:table-cell">Account</th>
                  <th>
                    <button type="button" class="sort-btn" [attr.aria-sort]="sort.key === 'amount' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'"
                      (click)="sortBy('amount')">
                      Amount
                      @if (sort.key === 'amount') { <i class="pi text-[9px]" [class.pi-arrow-up]="sort.dir === 'asc'" [class.pi-arrow-down]="sort.dir === 'desc'"></i> }
                    </button>
                  </th>
                  <th class="hidden sm:table-cell">Status</th>
                  <th><span class="sr-only">Row actions</span></th>
                </tr>
              </thead>
              <tbody #tbody>
                @for (tx of rows; track tx.id) {
                  <tr class="tx-row group" [class.tx-row-selected]="isSelected(tx.id)">
                    <td data-label="Select">
                      <input type="checkbox" class="tx-check" [checked]="isSelected(tx.id)" (change)="toggleRow(tx.id)"
                        [attr.aria-label]="'Select ' + tx.payee" />
                    </td>
                    <td data-label="Date" class="whitespace-nowrap text-ink-soft">{{ fmtDate(tx.date) }}</td>
                    <td data-label="Payee" class="font-medium text-teal-950">{{ tx.payee }}</td>
                    <td data-label="Category">
                      <span class="inline-flex items-center gap-1.5 text-ink">
                        <span class="h-2 w-2 rounded-sm" [style.background]="color(tx.category)" aria-hidden="true"></span>
                        {{ tx.category }}
                      </span>
                    </td>
                    <td data-label="Account" class="hidden text-ink-soft md:table-cell">{{ tx.account }}</td>
                    <td data-label="Amount" class="whitespace-nowrap font-display font-bold tabular-nums"
                      [class.text-positive]="tx.amount > 0">
                      {{ tx.amount > 0 ? '+' + money(tx.amount) : money(tx.amount) }}
                    </td>
                    <td data-label="Status" class="hidden sm:table-cell">
                      @if (tx.status) {
                        <p-tag [value]="tx.status" [severity]="severity(tx.status)" class="text-[11px]"></p-tag>
                      } @else {
                        <span class="text-xs text-ink-soft">—</span>
                      }
                    </td>
                    <td data-label="Actions">
                      <span class="flex items-center justify-end gap-1">
                        <button type="button" class="row-action" [attr.aria-label]="'Edit ' + tx.payee" (click)="editTx(tx)">
                          <i class="pi pi-pencil text-xs"></i>
                        </button>
                        <button type="button" class="row-action row-action-danger" [attr.aria-label]="'Delete ' + tx.payee" (click)="deleteTx(tx)">
                          <i class="pi pi-trash text-xs"></i>
                        </button>
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Summary strip -->
      <div class="mt-5 grid grid-cols-2 gap-2.5 border-t border-mint-100 pt-4 sm:grid-cols-3 xl:grid-cols-6" aria-label="Transaction summary">
        <div class="strip-tile"><span class="strip-key">Transactions</span><span class="strip-val">{{ strip.count }}</span></div>
        <div class="strip-tile">
          <span class="strip-key">Largest</span>
          <span class="strip-val">{{ strip.largest ? money(strip.largest.amount) : '—' }}</span>
          @if (strip.largest) { <span class="strip-sub">{{ strip.largest.payee }}</span> }
        </div>
        <div class="strip-tile">
          <span class="strip-key">Average</span>
          <span class="strip-val">{{ strip.count ? signedMoney(strip.average) : '—' }}</span>
        </div>
        <div class="strip-tile">
          <span class="strip-key">Total income</span>
          <span class="strip-val text-positive">{{ strip.count ? '+' + money(strip.income) : '—' }}</span>
        </div>
        <div class="strip-tile">
          <span class="strip-key">First entry</span>
          <span class="strip-val">{{ strip.first ? fmtDate(strip.first) : '—' }}</span>
        </div>
        <div class="strip-tile">
          <span class="strip-key">Last entry</span>
          <span class="strip-val">{{ strip.last ? fmtDate(strip.last) : '—' }}</span>
        </div>
      </div>
    </section>
  `,
})
export class TransactionsComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly categories = [...CATEGORIES];
  readonly typeOptions = [
    { label: 'All types', value: null as string | null },
    { label: 'Income', value: 'income' as string | null },
    { label: 'Expenses', value: 'expense' as string | null },
  ];

  @ViewChild('tbody') tbody?: ElementRef<HTMLElement>;

  rows: Transaction[] = [];
  filters: Filters = { category: null, type: null, dateStart: null, dateEnd: null, payee: null };
  sort: { key: SortKey; dir: 'asc' | 'desc' } = { key: 'date', dir: 'desc' };
  selection: string[] = [];
  strip: { count: number; largest: Transaction | null; average: number; income: number; first: string | null; last: string | null } =
    { count: 0, largest: null, average: 0, income: 0, first: null, last: null };
  visibleCount = 0;
  totalCount = 0;
  menu: 'category' | 'type' | null = null;
  bulkCategory = '';
  dateStartDraft = '';
  dateEndDraft = '';
  dateError: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(private store: Store<{ app: AppState }>) {}

  ngOnInit(): void {
    combineLatest([
      this.store.select(selectVisibleTransactions),
      this.store.select((s) => s.app.filters),
      this.store.select((s) => s.app.sort),
      this.store.select((s) => s.app.selection),
      this.store.select((s) => s.app.transactions.length),
      this.store.select(selectSummaryStrip),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([rows, filters, sort, selection, total, strip]) => {
        this.rows = rows;
        this.filters = filters;
        this.sort = sort;
        this.selection = selection;
        this.visibleCount = rows.length;
        this.totalCount = total;
        this.strip = strip;
        if (!this.dateError) {
          this.dateStartDraft = filters.dateStart ?? '';
          this.dateEndDraft = filters.dateEnd ?? '';
        }
      });
  }

  ngAfterViewInit(): void {
    if (this.tbody) {
      autoAnimate(this.tbody.nativeElement, { duration: 280 });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  color = categoryColor;
  fmtDate = fmtDate;
  money = money;
  signedMoney = signedMoney;

  severity(status: string): 'success' | 'warn' | 'info' | 'secondary' {
    if (status === 'cleared') return 'success';
    if (status === 'pending') return 'warn';
    return 'info';
  }

  isSelected(id: string): boolean {
    return this.selection.includes(id);
  }

  get allSelected(): boolean {
    return this.rows.length > 0 && this.rows.every((r) => this.selection.includes(r.id));
  }

  get selectionCount(): number {
    return this.selection.length;
  }

  get activeChips(): { key: string; label: string }[] {
    const chips: { key: string; label: string }[] = [];
    if (this.filters.category) chips.push({ key: 'category', label: `Category: ${this.filters.category}` });
    if (this.filters.type) chips.push({ key: 'type', label: `Type: ${this.filters.type === 'income' ? 'Income' : 'Expenses'}` });
    if (this.filters.dateStart || this.filters.dateEnd) {
      chips.push({
        key: 'date-range',
        label: `Dates: ${this.filters.dateStart ?? '…'} → ${this.filters.dateEnd ?? '…'}`,
      });
    }
    if (this.filters.payee) chips.push({ key: 'payee', label: `Payee: “${this.filters.payee}”` });
    return chips;
  }

  toggleMenu(menu: 'category' | 'type'): void {
    this.menu = this.menu === menu ? null : menu;
  }

  setCategory(category: string | null): void {
    this.store.dispatch(A.applyFilter({ key: 'category', value: category }));
    this.menu = null;
  }

  setType(type: string | null): void {
    this.store.dispatch(A.applyFilter({ key: 'type', value: type }));
    this.menu = null;
  }

  onPayeeInput(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.store.dispatch(A.applyFilter({ key: 'payee', value: q || null }));
  }

  onDateChange(): void {
    const start = (document.getElementById('date-start') as HTMLInputElement).value.trim();
    const end = (document.getElementById('date-end') as HTMLInputElement).value.trim();
    if (start && !ISO.test(start)) {
      this.dateError = 'Start date must be an ISO date (YYYY-MM-DD); the range was not applied.';
      return;
    }
    if (end && !ISO.test(end)) {
      this.dateError = 'End date must be an ISO date (YYYY-MM-DD); the range was not applied.';
      return;
    }
    if (start && end && start > end) {
      this.dateError = 'End date must be on or after start date; the range was not applied.';
      // A change event from the first field may already have applied an
      // open-ended half of the draft range. Roll that transient half back so
      // an invalid completed range never leaves the table partially filtered.
      if ((this.filters.dateStart === start && this.filters.dateEnd === null) ||
          (this.filters.dateEnd === end && this.filters.dateStart === null)) {
        this.store.dispatch(A.applyFilter({ key: 'dateStart', value: null }));
        this.store.dispatch(A.applyFilter({ key: 'dateEnd', value: null }));
      }
      return;
    }
    this.dateError = null;
    this.store.dispatch(A.applyFilter({ key: 'dateStart', value: start || null }));
    this.store.dispatch(A.applyFilter({ key: 'dateEnd', value: end || null }));
  }

  removeChip(key: string): void {
    if (key === 'date-range') {
      this.store.dispatch(A.applyFilter({ key: 'dateStart', value: null }));
      this.store.dispatch(A.applyFilter({ key: 'dateEnd', value: null }));
    } else {
      this.store.dispatch(A.applyFilter({ key: key as 'category' | 'type' | 'payee', value: null }));
    }
  }

  clearAll(): void {
    this.dateError = null;
    this.store.dispatch(A.clearFilters());
    this.store.dispatch(A.showToast({ message: 'Filters cleared', nonce: Date.now() }));
  }

  sortBy(key: SortKey): void {
    const dir = this.sort.key === key && this.sort.dir === 'desc' ? 'asc' : 'desc';
    this.store.dispatch(A.setSort({ key, dir }));
  }

  toggleRow(id: string): void {
    this.store.dispatch(A.toggleSelect({ id }));
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.store.dispatch(A.clearSelection());
    } else {
      this.store.dispatch(A.setSelection({ ids: this.rows.map((r) => r.id) }));
    }
  }

  clearSelection(): void {
    this.store.dispatch(A.clearSelection());
  }

  applyBulkCategorize(): void {
    if (!this.bulkCategory || this.selection.length === 0) return;
    this.store.dispatch(A.bulkCategorize({ ids: [...this.selection], category: this.bulkCategory }));
    this.store.dispatch(A.flashCategory({ category: this.bulkCategory, nonce: Date.now() }));
    this.store.dispatch(
      A.showToast({
        message: `${this.selection.length} transactions moved to ${this.bulkCategory}`,
        nonce: Date.now(),
      }),
    );
    this.bulkCategory = '';
    this.store.dispatch(A.clearSelection());
  }

  bulkDelete(): void {
    if (this.selection.length === 0) return;
    this.store.dispatch(A.openConfirm({ kind: 'bulk', ids: [...this.selection] }));
  }

  deleteTx(tx: Transaction): void {
    this.store.dispatch(A.openConfirm({ kind: 'single', ids: [tx.id] }));
  }

  editTx(tx: Transaction): void {
    this.store.dispatch(A.openDialog({ mode: 'edit', id: tx.id, prefill: null }));
  }

  newTx(): void {
    this.store.dispatch(A.openDialog({ mode: 'create', id: null, prefill: null }));
  }

  demoToast(message: string): void {
    this.store.dispatch(A.showToast({ message, nonce: Date.now() }));
  }
}
