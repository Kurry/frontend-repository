import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import type { AppState } from '../core/model';
import { analyzeCsv, applyRowFix, rowsToTransactions } from '../core/contract';
import type { FieldKey, ImportAnalysis, ImportRow } from '../core/contract';
import { fmtDate } from '../core/format';
import { TrapFocusDirective } from '../core/trap-focus.directive';
import * as A from '../store/app.actions';

const CELL_FIELDS: FieldKey[] = ['date', 'payee', 'category', 'account', 'amount', 'status'];

/**
 * Import CSV diagnostic panel: live per-row validation against the field
 * contract, a mismatch list naming row numbers and offending fields, per-cell
 * previews with one-tap fixes, and Replace all / Append commit modes.
 */
@Component({
  selector: 'app-import-panel',
  imports: [TrapFocusDirective],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-teal-950/45 px-4 py-8" (click)="onScrim($event)">
        <div
          appTrapFocus
          fallbackFocusId="import-csv-btn"
          (escapePressed)="close()"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-title"
          tabindex="-1"
          class="overlay-card w-full max-w-3xl rounded-2xl border border-mint-200 bg-white p-6 shadow-2xl shadow-teal-950/25"
        >
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow text-[11px] font-semibold uppercase tracking-[0.14em] text-mint-600">Ledger · Reports</p>
              <h2 id="import-title" class="font-display text-xl font-bold text-teal-950">Import CSV</h2>
              <p class="mt-0.5 text-xs text-ink-soft">Each row is validated against the transaction field contract before commit.</p>
            </div>
            <button type="button" (click)="close()" aria-label="Close import panel"
              class="flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-mint-100 hover:text-teal-950 focus-ring">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <label class="field block">
            <span class="field-label">Paste CSV rows</span>
            <textarea
              data-autofocus
              rows="6"
              [value]="csvText"
              (input)="onCsvInput($event)"
              aria-describedby="csv-format"
              class="field-input resize-y font-mono text-[12px] leading-relaxed"
            ></textarea>
            <span id="csv-format" class="field-hint">Expected header: date,payee,category,account,amount,status — one transaction per line, signed amounts.</span>
          </label>

          <div class="mt-3 flex flex-wrap items-center gap-4">
            <label class="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <i class="pi pi-file-arrow-up text-mint-600"></i>
              <span class="font-medium underline decoration-mint-300 underline-offset-2">Choose a CSV file</span>
              <input type="file" accept=".csv,text/csv" class="sr-only" (change)="onFile($event)" aria-label="Choose a CSV file" />
            </label>

            <fieldset class="flex items-center gap-1 rounded-lg border border-mint-200 bg-mint-50 p-1">
              <legend class="sr-only">Import mode</legend>
              <button type="button" (click)="mode = 'replace'" class="seg-btn" [class.seg-active]="mode === 'replace'"
                [attr.aria-pressed]="mode === 'replace'">Replace all</button>
              <button type="button" (click)="mode = 'append'" class="seg-btn" [class.seg-active]="mode === 'append'"
                [attr.aria-pressed]="mode === 'append'">Append</button>
            </fieldset>

            <button type="button" class="btn-secondary ml-auto" (click)="loadSample()">Load sample rows</button>
          </div>

          @if (analysis.headerError) {
            <p class="mt-4 rounded-lg border border-danger/30 bg-danger-bg px-3 py-2.5 text-sm text-danger-deep" role="alert">
              {{ analysis.headerError }}
            </p>
          }

          @if (!analysis.headerError && analysis.rows.length > 0) {
            <div class="mt-4 max-h-72 overflow-y-auto rounded-xl border border-mint-100">
              <table class="w-full text-left text-sm">
                <thead class="sticky top-0 bg-mint-50 text-[11px] uppercase tracking-wide text-ink-soft">
                  <tr>
                    <th class="px-3 py-2 font-semibold">Row</th>
                    <th class="px-3 py-2 font-semibold">Cell preview</th>
                    <th class="px-3 py-2 font-semibold">Validation</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of analysis.rows; track row.lineNo) {
                    <tr class="border-t border-mint-100 align-top" [class.bg-danger-bg]="row.errors.length > 0">
                      <td class="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-ink-soft">#{{ row.lineNo }}</td>
                      <td class="px-3 py-2.5">
                        <div class="flex flex-wrap gap-1.5">
                          @for (field of cellFields; track field) {
                            <span
                              class="cell-chip"
                              [class.cell-bad]="hasError(row, field)"
                              [title]="field"
                            >
                              <span class="cell-key">{{ field }}</span>
                              <span class="cell-val">{{ cellValue(row, field) }}</span>
                            </span>
                          }
                        </div>
                      </td>
                      <td class="px-3 py-2.5">
                        @if (row.errors.length === 0) {
                          <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-positive">
                            <i class="pi pi-check-circle"></i>Valid
                          </span>
                        } @else {
                          <ul class="space-y-1.5">
                            @for (err of row.errors; track err.field) {
                              <li class="flex flex-wrap items-center gap-2 text-xs text-danger-deep">
                                <span class="font-semibold">{{ err.field }}:</span> {{ err.message }}
                                @if (fixFor(row, err.field); as fix) {
                                  <button type="button" class="fix-btn" (click)="applyFix(row, err.field)">
                                    <i class="pi pi-wrench mr-1"></i>Fix: {{ fix.value }}
                                  </button>
                                }
                              </li>
                            }
                          </ul>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="mt-2 text-xs text-ink-soft" aria-live="polite">
              {{ analysis.validCount }} of {{ analysis.rows.length }} rows valid ·
              @if (analysis.validCount === 0) { nothing can be committed until at least one row passes validation }
              @else { committing {{ mode === 'replace' ? 'replaces the whole collection' : 'appends to the collection' }} }
            </p>
          }

          <div class="mt-5 flex items-center justify-end gap-3">
            <button type="button" class="btn-secondary" (click)="close()">Cancel</button>
            <button type="button" class="btn-primary" [disabled]="analysis.validCount === 0" (click)="commit()">
              Commit {{ analysis.validCount }} valid row{{ analysis.validCount === 1 ? '' : 's' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ImportPanelComponent implements OnInit {
  readonly cellFields = CELL_FIELDS;
  open = false;
  mode: 'replace' | 'append' = 'replace';
  csvText = '';
  analysis: ImportAnalysis = { headerError: null, rows: [], validCount: 0 };

  constructor(private store: Store<{ app: AppState }>) {}

  ngOnInit(): void {
    this.store.select((s) => s.app.importOpen).subscribe((open) => {
      this.open = open;
      if (open) this.analyze();
    });
  }

  onCsvInput(event: Event): void {
    this.csvText = (event.target as HTMLTextAreaElement).value;
    this.analyze();
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.csvText = String(reader.result ?? '');
      this.analyze();
    };
    reader.readAsText(file);
    input.value = '';
  }

  loadSample(): void {
    this.csvText = [
      'date,payee,category,account,amount,status',
      '2026-07-18,Ada Books,Groceries,Checking,-52.40,cleared',
      '2026-07-19,Evening Market,Restaurants,Credit Card,-31.75,pending',
      '2026-07-19,Studio Retainer,Freelance,Savings,410.00,cleared',
    ].join('\n');
    this.analyze();
  }

  private analyze(): void {
    this.analysis = analyzeCsv(this.csvText);
  }

  cellValue(row: ImportRow, field: FieldKey): string {
    const c = row.candidate;
    if (field === 'amount') return c.amount === null ? '—' : String(c.amount);
    const v = c[field];
    return v === '' || v === undefined ? '—' : field === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? fmtDate(v) : v;
  }

  hasError(row: ImportRow, field: FieldKey): boolean {
    return row.errors.some((e) => e.field === field);
  }

  fixFor(row: ImportRow, field: FieldKey) {
    return row.fixes[field] ?? null;
  }

  applyFix(row: ImportRow, field: FieldKey): void {
    const idx = this.analysis.rows.findIndex((r) => r.lineNo === row.lineNo);
    if (idx === -1) return;
    const fixed = applyRowFix(row, field);
    const rows = [...this.analysis.rows];
    rows[idx] = fixed;
    this.analysis = {
      ...this.analysis,
      rows,
      validCount: rows.filter((r) => r.errors.length === 0).length,
    };
  }

  commit(): void {
    const txs = rowsToTransactions(this.analysis.rows);
    if (txs.length === 0) return;
    this.store.dispatch(A.importTransactions({ transactions: txs, mode: this.mode }));
    this.store.dispatch(
      A.showToast({
        message: `Imported ${txs.length} transactions (${this.mode === 'replace' ? 'Replace all' : 'Append'})`,
        nonce: Date.now(),
      }),
    );
    this.csvText = '';
    this.analysis = { headerError: null, rows: [], validCount: 0 };
    this.close();
  }

  close(): void {
    this.store.dispatch(A.closeImport());
  }

  onScrim(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }
}
