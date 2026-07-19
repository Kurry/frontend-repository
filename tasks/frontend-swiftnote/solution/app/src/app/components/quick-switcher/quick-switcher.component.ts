import {
  Component, inject, AfterViewInit, ViewChild, ElementRef,
  signal, computed
} from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectSortedNotes } from '../../store/note.selectors';
import { closeQuickSwitcher, selectNote } from '../../store/note.actions';

@Component({
  selector: 'app-quick-switcher',
  standalone: true,
  template: `
    <div class="overlay-backdrop" (click)="close()" role="presentation">
      <div class="overlay-panel qs-panel" (click)="$event.stopPropagation()"
           role="dialog" aria-labelledby="quick-switcher-title" aria-modal="true">
        <h2 id="quick-switcher-title" class="qs-heading">Quick switcher</h2>
        <div class="qs-search-wrap">
          <span class="qs-icon">⚡</span>
          <label for="quick-switcher-search">Search notes</label>
          <input
            #searchInput
            id="quick-switcher-search"
            class="qs-input"
            type="text"
            placeholder="Search notes…"
            [value]="query()"
            (input)="onQueryChange($event)"
            (keydown)="onKeydown($event)"
            autocomplete="off"
          />
        </div>
        <div class="qs-list" role="listbox" aria-label="Note results">
          @if (filtered().length === 0) {
            <div class="qs-empty">No notes found</div>
          } @else {
            @for (note of filtered(); track note.id; let i = $index) {
              <div
                class="qs-item"
                [class.qs-item-active]="i === highlightIndex()"
                role="option"
                [attr.aria-selected]="i === highlightIndex()"
                (click)="openNote(note.id)"
                (mouseenter)="highlightIndex.set(i)">
                @if (note.pinned) {
                  <span class="qs-pin">📌</span>
                }
                <div class="qs-item-content">
                  <div class="qs-title" [innerHTML]="highlight(note.title || 'Untitled', query())"></div>
                  @if (note.body) {
                    <div class="qs-preview" [innerHTML]="highlight(truncate(note.body), query())"></div>
                  }
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .qs-panel {
      max-width: 560px;
    }
    .qs-heading {
      padding: 16px 20px 0;
      font-size: 24px;
      font-weight: 500;
    }
    .qs-search-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      flex-wrap: wrap;
    }
    .qs-icon { font-size: 20px; opacity: 0.7; }
    .qs-search-wrap label {
      color: rgba(255,255,255,0.72);
      font-size: 12px;
      font-weight: 500;
    }
    .qs-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-size: 16px;
      font-family: 'Roboto', sans-serif;
      color: #fff;
    }
    .qs-input::placeholder { color: rgba(255,255,255,0.4); }
    .qs-input:focus-visible {
      outline: 2px solid #F45B69;
      outline-offset: 4px;
      border-radius: 4px;
    }
    .qs-list {
      overflow-y: auto;
      max-height: 400px;
    }
    .qs-empty {
      padding: 32px;
      text-align: center;
      color: rgba(255,255,255,0.4);
      font-size: 14px;
    }
    .qs-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 20px;
      cursor: pointer;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      transition: background 0.1s;
    }
    .qs-item:hover { background: rgba(255,255,255,0.06); }
    .qs-item-active {
      background: rgba(244, 91, 105, 0.15) !important;
      border-left: 3px solid #F45B69;
      padding-left: 17px;
    }
    .qs-pin { font-size: 14px; margin-top: 2px; flex-shrink: 0; }
    .qs-item-content { min-width: 0; flex: 1; }
    .qs-title {
      font-size: 15px;
      font-weight: 500;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .qs-preview {
      font-size: 13px;
      color: rgba(255,255,255,0.5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }
  `]
})
export class QuickSwitcherComponent implements AfterViewInit {
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  private store = inject(Store);
  private allNotes = toSignal(this.store.select(selectSortedNotes), { initialValue: [] });

  query = signal('');
  highlightIndex = signal(0);

  filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.allNotes().slice(0, 50);
    return this.allNotes().filter(n =>
      n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    ).slice(0, 50);
  });

  ngAfterViewInit() {
    setTimeout(() => this.searchInputRef?.nativeElement.focus(), 50);
  }

  onQueryChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.query.set(val);
    // Clamp highlight to valid range
    const max = Math.max(0, this.filtered().length - 1);
    if (this.highlightIndex() > max) this.highlightIndex.set(0);
  }

  onKeydown(event: KeyboardEvent) {
    const len = this.filtered().length;
    if (len === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightIndex.set((this.highlightIndex() + 1) % len);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightIndex.set((this.highlightIndex() - 1 + len) % len);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const note = this.filtered()[this.highlightIndex()];
      if (note) this.openNote(note.id);
    } else if (event.key === 'Escape') {
      this.close();
    }
  }

  openNote(id: string) {
    this.store.dispatch(selectNote({ id }));
  }

  close() {
    this.store.dispatch(closeQuickSwitcher());
  }

  highlight(text: string, query: string): string {
    if (!query.trim()) return this.escapeHtml(text);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.escapeHtml(text).replace(
      new RegExp(escaped, 'gi'),
      m => `<mark>${m}</mark>`
    );
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  truncate(text: string, max = 80): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }
}
