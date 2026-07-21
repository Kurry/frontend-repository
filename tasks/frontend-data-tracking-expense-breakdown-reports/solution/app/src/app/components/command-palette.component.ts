import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import type { AppState } from '../core/model';
import { TrapFocusDirective } from '../core/trap-focus.directive';
import * as A from '../store/app.actions';

interface PaletteCommand {
  id: string;
  title: string;
  shortcut: string;
  group: string;
  run: () => void;
}

/**
 * Cmd/Ctrl+K command palette. Typing filters the command list by title,
 * Escape closes without acting, and choosing a command closes the palette and
 * performs the action through the same handlers as the visible controls.
 */
@Component({
  selector: 'app-command-palette',
  imports: [TrapFocusDirective],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-[60] flex items-start justify-center bg-teal-950/45 px-4 pt-[12vh]" (click)="onScrim($event)">
        <div
          appTrapFocus
          fallbackFocusId="export-report-btn"
          (escapePressed)="close()"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          tabindex="-1"
          class="overlay-card w-full max-w-lg overflow-hidden rounded-2xl border border-mint-200 bg-white shadow-2xl shadow-teal-950/30"
        >
          <div class="flex items-center gap-3 border-b border-mint-100 px-4 py-3">
            <i class="pi pi-search text-ink-soft"></i>
            <input
              #queryInput
              data-autofocus
              type="text"
              [value]="query"
              (input)="onQuery($event)"
              (keydown)="onInputKeydown($event)"
              aria-label="Search commands"
              class="w-full bg-transparent text-sm text-ink outline-none"
            />
            <kbd class="kbd">esc</kbd>
          </div>

          <ul class="max-h-72 overflow-y-auto p-2" role="listbox" aria-label="Commands">
            @for (cmd of filtered; track cmd.id; let i = $index) {
              <li>
                <button
                  type="button"
                  role="option"
                  [attr.aria-selected]="i === active"
                  (click)="runCommand(cmd)"
                  (mouseenter)="active = i"
                  class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
                  [class.bg-mint-100]="i === active"
                  [class.text-teal-950]="true"
                >
                  <span class="flex items-center gap-2.5">
                    <i class="pi text-xs text-mint-600" [class]="iconFor(cmd)"></i>
                    <span class="font-medium">{{ cmd.title }}</span>
                    <span class="text-xs text-ink-soft">{{ cmd.group }}</span>
                  </span>
                  @if (cmd.shortcut) { <kbd class="kbd">{{ cmd.shortcut }}</kbd> }
                </button>
              </li>
            } @empty {
              <li class="px-3 py-6 text-center text-sm text-ink-soft">No commands match “{{ query }}”.</li>
            }
          </ul>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-mint-100 bg-mint-50 px-4 py-2.5 text-[11px] text-ink-soft">
            <span class="flex items-center gap-1.5"><kbd class="kbd">↑</kbd><kbd class="kbd">↓</kbd> Navigate</span>
            <span class="flex items-center gap-1.5"><kbd class="kbd">↵</kbd> Select</span>
            <span class="flex items-center gap-1.5"><kbd class="kbd">esc</kbd> Close</span>
            <span class="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1">
              <span class="flex items-center gap-1.5"><kbd class="kbd">N</kbd> New</span>
              <span class="flex items-center gap-1.5"><kbd class="kbd">E</kbd> Export</span>
              <span class="flex items-center gap-1.5"><kbd class="kbd">I</kbd> Import</span>
              <span class="flex items-center gap-1.5"><kbd class="kbd">/</kbd> Search payee</span>
              <span class="flex items-center gap-1.5"><kbd class="kbd">B</kbd>/<kbd class="kbd">T</kbd> Charts</span>
            </span>
          </div>
        </div>
      </div>
    }
  `,
})
export class CommandPaletteComponent implements OnInit {
  open = false;
  query = '';
  active = 0;
  commands: PaletteCommand[] = [];

  constructor(private store: Store<{ app: AppState }>) {}

  ngOnInit(): void {
    this.commands = [
      {
        id: 'new',
        title: 'New transaction',
        shortcut: 'N',
        group: 'Transactions',
        run: () => this.store.dispatch(A.openDialog({ mode: 'create', id: null, prefill: null })),
      },
      {
        id: 'breakdown',
        title: 'Switch to Breakdown',
        shortcut: 'B',
        group: 'Charts',
        run: () => {
          this.store.dispatch(A.setChartMode({ mode: 'breakdown' }));
          this.store.dispatch(A.showToast({ message: 'Showing Breakdown view', nonce: Date.now() }));
        },
      },
      {
        id: 'trends',
        title: 'Switch to Trends',
        shortcut: 'T',
        group: 'Charts',
        run: () => {
          this.store.dispatch(A.setChartMode({ mode: 'trends' }));
          this.store.dispatch(A.showToast({ message: 'Showing Trends view', nonce: Date.now() }));
        },
      },
      {
        id: 'export',
        title: 'Export report',
        shortcut: 'E',
        group: 'Report',
        run: () => this.store.dispatch(A.openDrawer({ tab: 'markdown' })),
      },
      {
        id: 'import',
        title: 'Import CSV',
        shortcut: 'I',
        group: 'Report',
        run: () => this.store.dispatch(A.openImport()),
      },
      {
        id: 'focus-search',
        title: 'Focus payee search',
        shortcut: '/',
        group: 'Filters',
        run: () => setTimeout(() => document.getElementById('payee-search')?.focus(), 0),
      },
      {
        id: 'clear-filters',
        title: 'Clear filters',
        shortcut: '',
        group: 'Filters',
        run: () => {
          this.store.dispatch(A.clearFilters());
          this.store.dispatch(A.showToast({ message: 'Filters cleared', nonce: Date.now() }));
        },
      },
    ];
    this.store.select((s) => s.app.paletteOpen).subscribe((open) => {
      this.open = open;
      if (open) {
        this.query = '';
        this.active = 0;
      }
    });
  }

  get filtered(): PaletteCommand[] {
    const q = this.query.trim().toLowerCase();
    return q ? this.commands.filter((c) => c.title.toLowerCase().includes(q)) : this.commands;
  }

  iconFor(cmd: PaletteCommand): string {
    const map: Record<string, string> = {
      new: 'pi-plus',
      breakdown: 'pi-sitemap',
      trends: 'pi-chart-pie',
      export: 'pi-download',
      import: 'pi-upload',
      'focus-search': 'pi-search',
      'clear-filters': 'pi-filter-slash',
    };
    return map[cmd.id] ?? 'pi-circle';
  }

  onQuery(event: Event): void {
    this.query = (event.target as HTMLInputElement).value;
    this.active = 0;
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.active = Math.min(this.active + 1, this.filtered.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.active = Math.max(this.active - 1, 0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const cmd = this.filtered[this.active];
      if (cmd) this.runCommand(cmd);
    }
  }

  runCommand(cmd: PaletteCommand): void {
    this.close();
    cmd.run();
  }

  close(): void {
    this.store.dispatch(A.closePalette());
  }

  onScrim(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }
}
