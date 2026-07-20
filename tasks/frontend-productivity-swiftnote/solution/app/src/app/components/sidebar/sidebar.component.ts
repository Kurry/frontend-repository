import {
  Component, inject, viewChild, ElementRef, computed
} from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { injectVirtualizer } from '@tanstack/angular-virtual';
import {
  selectFilteredNotes, selectSelectedNoteId, selectSearchQuery, selectTotalNotesCount
} from '../../store/note.selectors';
import {
  createNote, selectNote, setSearchQuery, loadSampleData, showToast, toggleSidebar
} from '../../store/note.actions';
import { Note } from '../../models/note.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  template: `
    <aside class="sidebar">
      <!-- Header -->
      <div class="sidebar-header">
        <h2 class="sidebar-title">⚡ SwiftNote</h2>
        <button class="btn-icon sidebar-close" (click)="closeSidebar()" aria-label="Close sidebar">✕</button>
      </div>

      <!-- Search + New Note -->
      <div class="sidebar-controls">
        <label class="field-label" for="notes-search">Search notes</label>
        <div class="pill-group">
          <input
            id="notes-search"
            class="pill-input"
            type="search"
            placeholder="Search notes…"
            [value]="searchQuery()"
            (input)="onSearchChange($event)"
          />
          <button class="pill-btn" (click)="newNote()">Create note</button>
        </div>
      </div>

      <!-- Note List (virtualized) -->
      <div class="notes-list-wrapper" #scrollContainer aria-label="Notes list" role="list">
        @if (totalCount() === 0 && searchQuery() === '') {
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <div class="empty-title">No notes yet</div>
            <div class="empty-hint">Press <kbd>Alt+N</kbd> or select <strong>Create note</strong> to create your first note</div>
          </div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <div class="empty-title">No results</div>
            <div class="empty-hint">No notes match "{{ searchQuery() }}"</div>
          </div>
        } @else {
          <div class="virtual-track" [style.height.px]="totalSize()">
            @for (vItem of virtualItems(); track vItem.index) {
              <div
                class="note-row"
                [class.selected]="filtered()[vItem.index]?.id === selectedNoteId()"
                [style.position]="'absolute'"
                [style.top.px]="vItem.start"
                [style.width]="'100%'"
                [style.height.px]="vItem.size"
                role="listitem">
                @if (filtered()[vItem.index]; as note) {
                  <button
                    class="note-row-button"
                    (click)="select(note.id)"
                    [attr.aria-label]="note.title || 'Untitled'">
                    <div class="note-row-inner">
                      <div class="note-row-top">
                        @if (note.pinned) { <span class="note-pin" aria-label="Pinned">📌</span> }
                        <span class="note-title" [innerHTML]="highlight(note.title || 'Untitled', searchQuery())"></span>
                        <span class="note-time">{{ formatTime(note.updatedAt) }}</span>
                      </div>
                      <div class="note-preview"
                           [innerHTML]="highlight(getPreview(note), searchQuery())">
                      </div>
                    </div>
                  </button>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Footer: virtual stats + load demo -->
      <div class="sidebar-footer">
        <div class="virtual-stats">
          <span class="stat-item" aria-label="Virtualized items">
            <span class="stat-label">Virtualized items</span>
            <span class="stat-value">{{ filtered().length }}</span>
          </span>
          <span class="stat-item" aria-label="Rendered item count">
            <span class="stat-label">Rendered item count</span>
            <span class="stat-value">{{ virtualItems().length }}</span>
          </span>
        </div>
        <button class="btn load-btn" (click)="onLoadSample()">
          Load 10,000 items
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 280px;
      min-width: 280px;
      background: #0a0a0a;
      border-right: 1px solid rgba(255,255,255,0.08);
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    .sidebar-header {
      padding: 16px 16px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .sidebar-title {
      font-size: 24px;
      font-weight: 700;
      color: #F45B69;
      letter-spacing: -0.01em;
    }

    .sidebar-close { display: none; }

    .sidebar-controls {
      padding: 12px 12px 8px;
    }

    .field-label {
      display: block;
      margin: 0 0 6px 2px;
      color: rgba(255,255,255,0.72);
      font-size: 12px;
      font-weight: 500;
    }

    .notes-list-wrapper {
      flex: 1;
      overflow-y: auto;
      position: relative;
      min-height: 0;
    }

    .virtual-track {
      position: relative;
      width: 100%;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      gap: 8px;
    }

    .empty-icon { font-size: 36px; margin-bottom: 8px; }

    .empty-title {
      font-size: 16px;
      font-weight: 500;
      color: rgba(255,255,255,0.7);
    }

    .empty-hint {
      font-size: 13px;
      color: rgba(255,255,255,0.62);
      line-height: 1.5;
    }

    .empty-hint kbd {
      display: inline-block;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 4px;
      padding: 1px 6px;
      font-size: 12px;
    }

    .note-row {
      box-sizing: border-box;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      transition: background 0.1s;
    }

    .note-row:hover { background: rgba(255,255,255,0.05); }
    .note-row.selected { background: rgba(244, 91, 105, 0.16); border-left: 3px solid #F45B69; }
    .note-row.selected .note-row-button { background: rgba(244, 91, 105, 0.16); }

    .note-row-button {
      width: 100%;
      height: 100%;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      text-align: left;
      font: inherit;
      cursor: pointer;
    }
    .note-row-button:focus-visible { outline: 2px solid #F45B69; outline-offset: -2px; }

    .note-row-inner {
      padding: 10px 14px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
    }

    .note-row-top {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
    }

    .note-pin { font-size: 12px; flex-shrink: 0; }

    .note-title {
      font-size: 14px;
      font-weight: 500;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .note-time {
      font-size: 11px;
      color: rgba(255,255,255,0.6);
      flex-shrink: 0;
      white-space: nowrap;
    }

    .note-preview {
      font-size: 12px;
      color: rgba(255,255,255,0.62);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }

    .sidebar-footer {
      padding: 10px 12px;
      border-top: 1px solid rgba(255,255,255,0.08);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .virtual-stats {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .stat-label {
      font-size: 10px;
      color: rgba(255,255,255,0.6);
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 13px;
      font-weight: 600;
      color: #F45B69;
    }

    .load-btn {
      width: 100%;
      justify-content: center;
      font-size: 12px;
      padding: 8px;
    }

    @media (max-width: 600px) {
      .sidebar {
        width: min(88vw, 280px);
        min-width: min(88vw, 280px);
      }
      .sidebar-close { display: inline-flex; }
    }
  `]
})
export class SidebarComponent {
  private store = inject(Store);

  searchQuery = toSignal(this.store.select(selectSearchQuery), { initialValue: '' });
  selectedNoteId = toSignal(this.store.select(selectSelectedNoteId), { initialValue: null });
  filtered = toSignal(this.store.select(selectFilteredNotes), { initialValue: [] });
  totalCount = toSignal(this.store.select(selectTotalNotesCount), { initialValue: 0 });

  scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');

  virtualizer = injectVirtualizer(() => ({
    count: this.filtered().length,
    estimateSize: () => 72,
    scrollElement: this.scrollContainer(),
    overscan: 8,
  }));

  virtualItems = computed(() => this.virtualizer.getVirtualItems());
  totalSize = computed(() => this.virtualizer.getTotalSize());

  newNote() {
    this.store.dispatch(createNote());
    this.store.dispatch(showToast({ message: 'New note created' }));
  }

  select(id: string | undefined) {
    if (!id) return;
    this.store.dispatch(selectNote({ id: this.selectedNoteId() === id ? null : id }));
    if (window.matchMedia('(max-width: 600px)').matches) {
      this.store.dispatch(toggleSidebar());
    }
  }

  onSearchChange(event: Event) {
    const q = (event.target as HTMLInputElement).value;
    this.store.dispatch(setSearchQuery({ query: q }));
  }

  onLoadSample() {
    this.store.dispatch(loadSampleData());
    this.store.dispatch(showToast({ message: '10,000 sample notes loaded' }));
  }

  closeSidebar() {
    this.store.dispatch(toggleSidebar());
  }

  formatTime(ts: number): string {
    const diff = Date.now() - ts;
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)}d ago`;
    return new Date(ts).toLocaleDateString();
  }

  getPreview(note: Note): string {
    const body = note.body.replace(/\s+/g, ' ').trim();
    return body.length > 80 ? body.slice(0, 80) + '…' : body;
  }

  highlight(text: string, query: string): string {
    if (!query.trim()) return this.escHtml(text);
    const esc = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.escHtml(text).replace(new RegExp(esc, 'gi'), m => `<mark>${m}</mark>`);
  }

  private escHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
