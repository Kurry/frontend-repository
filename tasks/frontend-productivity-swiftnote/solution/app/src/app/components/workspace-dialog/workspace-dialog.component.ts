import {
  Component, inject, signal, computed, effect, ViewChild, ElementRef
} from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  selectNotes, selectSelectedNoteId, selectSelectedNote,
  selectWorkspaceExportOpen, selectWorkspaceImportOpen, selectTxtExportOpen,
} from '../../store/note.selectors';
import {
  closeWorkspaceExport, closeWorkspaceImport, closeTxtExport,
  importWorkspace, showToast,
} from '../../store/note.actions';
import {
  serializeWorkspace, parseWorkspace, flattenNoteToText, validateTxtFilename,
} from '../../store/workspace';
import { DialogFocusService, trapFocus } from '../../services/dialog-focus.service';

@Component({
  selector: 'app-workspace-dialog',
  standalone: true,
  template: `
    <!-- Export Workspace -->
    @if (exportOpen()) {
      <div class="overlay-backdrop" (click)="closeExport()" role="presentation">
        <div class="overlay-panel ws-panel" (click)="$event.stopPropagation()"
             (keydown)="onDialogKeydown($event, 'export')"
             role="dialog" aria-modal="true" aria-labelledby="ws-export-title">
          <div class="ws-header">
            <h2 id="ws-export-title">Export workspace</h2>
            <button class="btn-icon" (click)="closeExport()" aria-label="Close export workspace">✕</button>
          </div>
          <div class="ws-body">
            <label class="ws-label" for="ws-export-json">Workspace JSON</label>
            <textarea #exportFirst id="ws-export-json" class="ws-json" readonly
                      aria-label="Workspace JSON preview">{{ workspaceJson() }}</textarea>
          </div>
          <div class="ws-footer">
            <button class="btn" (click)="copyWorkspace()">Copy</button>
            <button class="btn btn-primary" (click)="downloadWorkspace()">Download</button>
          </div>
        </div>
      </div>
    }

    <!-- Import Workspace -->
    @if (importOpen()) {
      <div class="overlay-backdrop" (click)="closeImport()" role="presentation">
        <div class="overlay-panel ws-panel" (click)="$event.stopPropagation()"
             (keydown)="onDialogKeydown($event, 'import')"
             role="dialog" aria-modal="true" aria-labelledby="ws-import-title">
          <div class="ws-header">
            <h2 id="ws-import-title">Import workspace</h2>
            <button class="btn-icon" (click)="closeImport()" aria-label="Close import workspace">✕</button>
          </div>
          <div class="ws-body">
            <label class="ws-label" for="ws-import-json">Paste workspace JSON</label>
            <textarea #importFirst id="ws-import-json" class="ws-json"
                      placeholder="Paste exported workspace JSON here…"
                      [value]="importText()" (input)="onImportInput($event)"
                      aria-label="Paste workspace JSON"></textarea>
            @if (importError()) {
              <div class="ws-error" role="alert" aria-live="polite">{{ importError() }}</div>
            }
          </div>
          <div class="ws-footer">
            <button class="btn" (click)="closeImport()">Cancel</button>
            <button class="btn btn-primary" (click)="confirmImport()"
                    [disabled]="!importText().trim()">Import</button>
          </div>
        </div>
      </div>
    }

    <!-- Export as .txt -->
    @if (txtOpen()) {
      <div class="overlay-backdrop" (click)="closeTxt()" role="presentation">
        <div class="overlay-panel ws-panel ws-panel-sm" (click)="$event.stopPropagation()"
             (keydown)="onDialogKeydown($event, 'txt')"
             role="dialog" aria-modal="true" aria-labelledby="txt-export-title">
          <div class="ws-header">
            <h2 id="txt-export-title">Export as .txt</h2>
            <button class="btn-icon" (click)="closeTxt()" aria-label="Close export as text">✕</button>
          </div>
          <div class="ws-body">
            <label class="ws-label" for="txt-filename">Filename</label>
            <input #txtFirst id="txt-filename" class="ws-input" type="text"
                   [value]="filename()" (input)="onFilenameInput($event)"
                   aria-label="Export filename" />
            @if (filenameError()) {
              <div class="ws-error" role="alert" aria-live="polite">{{ filenameError() }}</div>
            } @else {
              <div class="ws-hint">The open note’s text is saved as a plain-text file; formatting is flattened and each image becomes a filename placeholder line.</div>
            }
          </div>
          <div class="ws-footer">
            <button class="btn" (click)="closeTxt()">Cancel</button>
            <button class="btn btn-primary" (click)="confirmTxt()"
                    [disabled]="filenameError() !== null">Download .txt</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .ws-panel { max-width: 600px; }
    .ws-panel-sm { max-width: 460px; }
    .ws-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 22px 14px; border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .ws-header h2 { font-size: 22px; font-weight: 600; color: #fff; }
    .ws-body { padding: 16px 22px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
    .ws-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.8); }
    .ws-json {
      width: 100%; min-height: 240px; resize: vertical;
      background: #050505; color: #d7dbe0; border: 1px solid rgba(255,255,255,0.18);
      border-radius: 8px; padding: 12px; font-family: 'Roboto Mono', monospace;
      font-size: 12px; line-height: 1.5;
    }
    .ws-input {
      width: 100%; background: #050505; color: #fff;
      border: 1px solid rgba(255,255,255,0.25); border-radius: 8px;
      padding: 10px 12px; font-size: 14px; font-family: 'Roboto', sans-serif;
    }
    .ws-json:focus-visible, .ws-input:focus-visible { outline: 2px solid #F45B69; outline-offset: 2px; }
    .ws-error { color: #ff8a80; font-size: 13px; }
    .ws-hint { color: rgba(255,255,255,0.62); font-size: 12px; line-height: 1.45; }
    .ws-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 14px 22px 18px; border-top: 1px solid rgba(255,255,255,0.08);
    }
    .btn[disabled] { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class WorkspaceDialogComponent {
  private store = inject(Store);
  private dialogFocus = inject(DialogFocusService);

  @ViewChild('exportFirst') exportFirst?: ElementRef<HTMLElement>;
  @ViewChild('importFirst') importFirst?: ElementRef<HTMLElement>;
  @ViewChild('txtFirst') txtFirst?: ElementRef<HTMLElement>;

  exportOpen = toSignal(this.store.select(selectWorkspaceExportOpen), { initialValue: false });
  importOpen = toSignal(this.store.select(selectWorkspaceImportOpen), { initialValue: false });
  txtOpen = toSignal(this.store.select(selectTxtExportOpen), { initialValue: false });

  private notes = toSignal(this.store.select(selectNotes), { initialValue: [] });
  private selectedNoteId = toSignal(this.store.select(selectSelectedNoteId), { initialValue: null });
  private selectedNote = toSignal(this.store.select(selectSelectedNote), { initialValue: null });

  importText = signal('');
  importError = signal<string | null>(null);
  filename = signal('note.txt');
  filenameError = signal<string | null>(null);

  workspaceJson = computed(() =>
    JSON.stringify(serializeWorkspace(this.notes(), this.selectedNoteId()), null, 2)
  );

  private prevExport = false;
  private prevImport = false;
  private prevTxt = false;

  constructor() {
    effect(() => {
      const e = this.exportOpen(), i = this.importOpen(), t = this.txtOpen();
      const anyNowOpen = e || i || t;
      const anyWasOpen = this.prevExport || this.prevImport || this.prevTxt;

      if (t && !this.prevTxt) {
        const n = this.selectedNote();
        this.filename.set(`${(n?.title || 'note').replace(/[^a-z0-9]/gi, '_')}.txt`);
        this.filenameError.set(null);
      }
      if (i && !this.prevImport) {
        this.importText.set('');
        this.importError.set(null);
      }

      if (anyNowOpen) {
        setTimeout(() => {
          (this.exportFirst || this.importFirst || this.txtFirst)?.nativeElement.focus();
        }, 40);
      } else if (anyWasOpen) {
        this.dialogFocus.restore();
      }

      this.prevExport = e; this.prevImport = i; this.prevTxt = t;
    });
  }

  onDialogKeydown(event: KeyboardEvent, which: 'export' | 'import' | 'txt'): void {
    const panel = event.currentTarget as HTMLElement;
    trapFocus(panel, event);
    if (event.key === 'Escape') {
      if (which === 'export') this.closeExport();
      else if (which === 'import') this.closeImport();
      else this.closeTxt();
    }
  }

  closeExport() { this.store.dispatch(closeWorkspaceExport()); }
  closeImport() { this.store.dispatch(closeWorkspaceImport()); }
  closeTxt() { this.store.dispatch(closeTxtExport()); }

  async copyWorkspace() {
    const json = this.workspaceJson();
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(json);
      this.store.dispatch(showToast({ message: 'Workspace JSON copied' }));
    } catch {
      // Clipboard access denied/unavailable: don't claim a copy that didn't happen.
      this.store.dispatch(showToast({ message: 'Copy failed — clipboard access blocked' }));
    }
  }

  downloadWorkspace() {
    const json = this.workspaceJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'swiftnote-workspace.json';
    a.click();
    URL.revokeObjectURL(url);
    this.store.dispatch(showToast({ message: 'Workspace exported' }));
  }

  onImportInput(event: Event) {
    this.importText.set((event.target as HTMLTextAreaElement).value);
    if (this.importError()) this.importError.set(null);
  }

  confirmImport() {
    const result = parseWorkspace(this.importText());
    if (!result.ok) {
      this.importError.set(result.error ?? 'Import failed.');
      return;
    }
    this.store.dispatch(importWorkspace({
      notes: result.notes ?? [],
      selectedNoteId: result.selectedNoteId ?? null,
    }));
    this.store.dispatch(showToast({ message: 'Workspace imported' }));
  }

  onFilenameInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.filename.set(val);
    this.filenameError.set(validateTxtFilename(val));
  }

  confirmTxt() {
    const err = validateTxtFilename(this.filename());
    if (err) { this.filenameError.set(err); return; }
    const n = this.selectedNote();
    if (!n) { this.closeTxt(); return; }
    const content = flattenNoteToText(n);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.filename().trim();
    a.click();
    URL.revokeObjectURL(url);
    this.store.dispatch(closeTxtExport());
    this.store.dispatch(showToast({ message: 'Note exported' }));
  }
}
