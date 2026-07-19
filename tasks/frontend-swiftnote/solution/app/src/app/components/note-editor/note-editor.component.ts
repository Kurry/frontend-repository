import {
  Component, inject, signal, computed, effect, ViewChild, ElementRef
} from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  selectSelectedNote, selectFocusMode
} from '../../store/note.selectors';
import {
  updateNote, deleteNote, pinNote, duplicateNote,
  toggleFocusMode, showToast, openShortcuts, toggleSidebar, createNote
} from '../../store/note.actions';
import { NoteImage } from '../../models/note.model';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  template: `
    <div class="editor-shell" [class.focus-mode]="focusMode()">

      <!-- Top Toolbar -->
      <div class="editor-toolbar">
        <div class="toolbar-left">
          <button class="btn-icon sidebar-toggle" (click)="toggleSidebarPanel()" aria-label="Toggle sidebar" title="Toggle sidebar">☰</button>
          @if (focusMode()) {
            <button class="btn exit-focus-btn" (click)="exitFocusMode()">Exit focus mode</button>
          }
        </div>

        @if (note()) {
          <div class="toolbar-actions">
            <button class="btn-icon" [class.active]="note()!.pinned" (click)="togglePin()"
                    [title]="note()!.pinned ? 'Unpin note' : 'Pin note'"
                    [attr.aria-label]="note()!.pinned ? 'Unpin note' : 'Pin note'">📌</button>
            <button class="btn-icon" (click)="duplicate()" title="Duplicate note" aria-label="Duplicate note">⧉</button>
            <button class="btn-icon" (click)="toggleFocus()" [class.active]="focusMode()"
                    title="Toggle focus mode" aria-label="Toggle focus mode">⛶</button>
            <button class="btn-icon" (click)="exportNote()" title="Export as .txt" aria-label="Export as .txt">↓</button>
            <button class="btn-icon" (click)="openShortcutsPanel()" title="Keyboard shortcuts" aria-label="Show shortcuts">⌨</button>
            <button class="btn-icon danger-btn" (click)="onDeleteClick()" title="Delete note" aria-label="Delete note">🗑</button>
          </div>
        } @else {
          <div class="toolbar-actions">
            <button class="btn-icon" (click)="openShortcutsPanel()" title="Keyboard shortcuts" aria-label="Show shortcuts">⌨</button>
          </div>
        }
      </div>

      <!-- Delete Confirmation Bar -->
      @if (showDeleteConfirm()) {
        <div class="delete-confirm-bar" role="alert">
          <span>Delete this note permanently?</span>
          <div class="delete-confirm-actions">
            <button class="btn btn-danger" (click)="confirmDelete()">Delete note</button>
            <button class="btn" (click)="showDeleteConfirm.set(false)">Cancel</button>
          </div>
        </div>
      }

      <!-- Editor Content -->
      @if (note()) {
        <div class="editor-content" (dragover)="onDragOver($event)" (drop)="onDrop($event)">

          <!-- Title -->
          <h2 class="editor-section-title">Note</h2>
          <label class="field-label" for="note-title">Note title</label>
          <input
            #titleInput
            id="note-title"
            class="note-title-input"
            type="text"
            placeholder="Untitled"
            [value]="localTitle()"
            (input)="onTitleInput($event)"
            maxlength="200"
          />

          <!-- Body -->
          <label class="field-label body-label" for="note-body">Note body</label>
          <textarea
            id="note-body"
            class="note-body-input"
            placeholder="Start writing…"
            [value]="localBody()"
            (input)="onBodyInput($event)"
          ></textarea>

          <!-- Images -->
          @if (note()!.images.length > 0) {
            <div class="images-section">
              <div class="images-header">Attached images ({{ note()!.images.length }})</div>
              <div class="images-grid">
                @for (img of note()!.images; track img.id) {
                  <div class="image-thumb-wrap">
                    <img [src]="img.dataUrl" [alt]="img.filename" class="image-thumb" />
                    <button class="image-remove-btn" (click)="removeImage(img.id)"
                            [attr.aria-label]="'Remove image ' + img.filename">✕</button>
                    <div class="image-name">{{ img.filename }}</div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Insert Image + Save indicator -->
          <div class="bottom-row">
            <div class="insert-image-row">
              <button class="btn" (click)="triggerImagePicker()"><span aria-hidden="true">📷</span> Insert image</button>
              <input
                #fileInput
                type="file"
                accept="image/*"
                multiple
                style="display:none"
                (change)="onFileSelected($event)"
                aria-label="Choose image file"
              />
              <span class="drop-hint">or drag &amp; drop onto the editor</span>
            </div>
            @if (saved()) {
              <div class="saved-indicator" role="status" aria-live="polite">✓ Saved</div>
            }
          </div>

          <!-- Word & Character Count -->
          <div class="word-count" aria-label="Word and character count">
            <span>Words: <strong>{{ wordCount() }}</strong></span>
            <span>Characters: <strong>{{ charCount() }}</strong></span>
          </div>
        </div>
      } @else {
        <!-- No note selected -->
        <div class="no-note-state">
          <div class="no-note-icon">📝</div>
          <h1>SwiftNote</h1>
          <h2>Write without friction</h2>
          <div class="no-note-text">Select a note or create your first note</div>
          <button class="btn btn-primary" (click)="newNote()">Create note</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .editor-shell {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #0d0d0d;
      min-width: 0;
      height: 100vh;
      overflow: hidden;
    }

    .editor-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      background: #0a0a0a;
      min-height: 64px;
      gap: 12px;
      flex-shrink: 0;
    }

    .toolbar-left { display: flex; align-items: center; gap: 8px; }

    .sidebar-toggle { font-size: 18px; color: rgba(255,255,255,0.6); }

    .exit-focus-btn { font-size: 13px; padding: 6px 12px; }

    .toolbar-actions { display: flex; align-items: center; gap: 8px; }

    .danger-btn { color: #ef5350 !important; }
    .danger-btn:hover { background: rgba(239,83,80,0.15) !important; }

    .delete-confirm-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 20px;
      background: rgba(229, 57, 53, 0.1);
      border-bottom: 1px solid rgba(229, 57, 53, 0.3);
      gap: 16px;
      font-size: 14px;
      color: #ef9a9a;
      flex-wrap: wrap;
      flex-shrink: 0;
    }

    .delete-confirm-actions { display: flex; gap: 8px; }

    .editor-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 24px 32px;
      overflow-y: auto;
      gap: 12px;
      width: 100%;
      max-width: 860px;
      margin: 0 auto;
    }

    .editor-section-title {
      font-size: 24px;
      font-weight: 500;
      color: rgba(255,255,255,0.82);
      margin-bottom: 4px;
    }

    .field-label {
      display: block;
      color: rgba(255,255,255,0.72);
      font-size: 12px;
      font-weight: 500;
    }

    .body-label { margin-top: 8px; }

    .note-title-input {
      background: transparent;
      border: none;
      outline: none;
      font-family: 'Roboto', sans-serif;
      font-size: 55px;
      font-weight: 700;
      color: #fff;
      width: 100%;
      padding: 0;
      letter-spacing: -0.01em;
      flex-shrink: 0;
    }

    .note-title-input::placeholder { color: rgba(255,255,255,0.2); }
    .note-title-input:focus-visible,
    .note-body-input:focus-visible {
      outline: 2px solid #F45B69;
      outline-offset: 4px;
      border-radius: 4px;
    }

    .note-body-input {
      background: transparent;
      border: none;
      outline: none;
      font-family: 'Roboto', sans-serif;
      font-size: 16px;
      color: rgba(255,255,255,0.9);
      width: 100%;
      min-height: 200px;
      flex: 1;
      resize: none;
      line-height: 1.55;
      padding: 0;
    }

    .note-body-input::placeholder { color: rgba(255,255,255,0.2); }

    .images-section {
      border-top: 1px solid rgba(255,255,255,0.08);
      padding-top: 12px;
      flex-shrink: 0;
    }

    .images-header {
      font-size: 12px;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.06em;
      margin-bottom: 10px;
    }

    .images-grid { display: flex; flex-wrap: wrap; gap: 10px; }

    .image-thumb-wrap {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .image-thumb {
      width: 100px;
      height: 80px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.15);
    }

    .image-remove-btn {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #333;
      border: 1px solid rgba(255,255,255,0.2);
      color: #fff;
      font-size: 11px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .image-remove-btn:hover { background: #e53935; }
    .image-remove-btn:focus-visible { outline: 2px solid #F45B69; outline-offset: 2px; }
    .image-remove-btn:active { transform: translateY(1px); }

    .image-name {
      font-size: 11px;
      color: rgba(255,255,255,0.4);
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bottom-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      flex-shrink: 0;
    }

    .insert-image-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .drop-hint { font-size: 12px; color: rgba(255,255,255,0.3); font-style: italic; }

    .saved-indicator {
      font-size: 12px;
      color: #66bb6a;
      display: flex;
      align-items: center;
      gap: 4px;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .word-count {
      display: flex;
      gap: 20px;
      font-size: 12px;
      color: rgba(255,255,255,0.35);
      padding-top: 8px;
      border-top: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }

    .word-count strong { color: rgba(255,255,255,0.6); font-weight: 500; }

    .no-note-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      color: rgba(255,255,255,0.4);
    }

    .no-note-icon { font-size: 48px; }
    .no-note-text { font-size: 16px; }
    .no-note-state h1 { font-size: 55px; color: #fff; }
    .no-note-state h2 { font-size: 24px; color: rgba(255,255,255,0.72); }

    /* Drag-over state */
    .editor-content.dragover {
      background: rgba(244, 91, 105, 0.05);
      outline: 2px dashed rgba(244, 91, 105, 0.4);
      outline-offset: -4px;
    }

    @media (max-width: 500px) {
      .editor-toolbar {
        align-items: flex-start;
        flex-wrap: wrap;
        padding: 8px 12px;
      }
      .toolbar-actions {
        order: 2;
        width: 100%;
        justify-content: space-between;
      }
      .editor-content { padding: 16px; max-width: 100%; }
      .note-title-input { font-size: 36px; }
      .no-note-state { padding: 24px; text-align: center; }
      .no-note-state h1 { font-size: 44px; }
    }
  `]
})
export class NoteEditorComponent {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('titleInput') titleInputRef!: ElementRef<HTMLInputElement>;

  private store = inject(Store);

  note = toSignal(this.store.select(selectSelectedNote), { initialValue: null });
  focusMode = toSignal(this.store.select(selectFocusMode), { initialValue: false });

  localTitle = signal('');
  localBody = signal('');
  saved = signal(false);
  showDeleteConfirm = signal(false);

  private savedTimer?: ReturnType<typeof setTimeout>;
  private pendingId: string | null = null;

  wordCount = computed(() => {
    const text = `${this.localTitle()} ${this.localBody()}`.trim();
    return text ? text.split(/\s+/).filter(Boolean).length : 0;
  });

  charCount = computed(() => (this.localTitle() + this.localBody()).length);

  constructor() {
    // Sync local state when selected note changes
    effect(() => {
      const n = this.note();
      if (n && n.id !== this.pendingId) {
        this.pendingId = n.id;
        this.localTitle.set(n.title);
        this.localBody.set(n.body);
        this.showDeleteConfirm.set(false);
        if (!n.title) {
          setTimeout(() => this.titleInputRef?.nativeElement.focus(), 50);
        }
      } else if (!n) {
        this.pendingId = null;
        this.localTitle.set('');
        this.localBody.set('');
      }
    });

  }

  onTitleInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.localTitle.set(val);
    const id = this.note()?.id;
    if (id) this.store.dispatch(updateNote({ id, changes: { title: val } }));
    this.flashSaved();
  }

  onBodyInput(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.localBody.set(val);
    const id = this.note()?.id;
    if (id) this.store.dispatch(updateNote({ id, changes: { body: val } }));
    this.flashSaved();
  }

  private flashSaved() {
    this.saved.set(true);
    if (this.savedTimer) clearTimeout(this.savedTimer);
    this.savedTimer = setTimeout(() => this.saved.set(false), 1800);
  }

  togglePin() {
    const id = this.note()?.id;
    if (id) this.store.dispatch(pinNote({ id }));
  }

  duplicate() {
    const id = this.note()?.id;
    if (id) {
      this.store.dispatch(duplicateNote({ id }));
      this.store.dispatch(showToast({ message: 'Note duplicated' }));
    }
  }

  toggleFocus() { this.store.dispatch(toggleFocusMode()); }
  exitFocusMode() { this.store.dispatch(toggleFocusMode()); }
  toggleSidebarPanel() { this.store.dispatch(toggleSidebar()); }
  openShortcutsPanel() { this.store.dispatch(openShortcuts()); }

  newNote() {
    this.store.dispatch(createNote());
    this.store.dispatch(showToast({ message: 'New note created' }));
  }

  onDeleteClick() { this.showDeleteConfirm.set(true); }

  confirmDelete() {
    const id = this.note()?.id;
    if (id) {
      this.store.dispatch(deleteNote({ id }));
      this.store.dispatch(showToast({ message: 'Note deleted' }));
    }
    this.showDeleteConfirm.set(false);
    this.pendingId = null;
  }

  exportNote() {
    const n = this.note();
    if (!n) return;
    const placeholders = n.images.map(img => `[Image: ${img.filename}]`).join('\n');
    const content = [
      n.title || 'Untitled',
      '─'.repeat(40),
      n.body,
      placeholders ? '\n' + placeholders : '',
    ].filter(Boolean).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(n.title || 'note').replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.store.dispatch(showToast({ message: 'Note exported' }));
  }

  triggerImagePicker() { this.fileInputRef?.nativeElement.click(); }

  onFileSelected(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files) this.embedImages(files);
    (event.target as HTMLInputElement).value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.add('dragover');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.remove('dragover');
    const files = event.dataTransfer?.files;
    if (files) this.embedImages(files);
  }

  private embedImages(files: FileList) {
    const id = this.note()?.id;
    if (!id) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const existing = [...(this.note()?.images ?? [])];
    let loaded = 0;
    const newImages: NoteImage[] = [...existing];

    for (const file of imageFiles) {
      const reader = new FileReader();
      reader.onload = (e) => {
        newImages.push({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          dataUrl: e.target?.result as string,
          filename: file.name,
        });
        loaded++;
        if (loaded === imageFiles.length) {
          this.store.dispatch(updateNote({ id, changes: { images: newImages } }));
          this.flashSaved();
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(imgId: string) {
    const n = this.note();
    if (!n) return;
    const images = n.images.filter(img => img.id !== imgId);
    this.store.dispatch(updateNote({ id: n.id, changes: { images } }));
    this.flashSaved();
  }
}
