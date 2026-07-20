import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NoteEditorComponent } from './components/note-editor/note-editor.component';
import { QuickSwitcherComponent } from './components/quick-switcher/quick-switcher.component';
import { ShortcutsDialogComponent } from './components/shortcuts-dialog/shortcuts-dialog.component';
import { ToastComponent } from './components/toast/toast.component';
import { WorkspaceDialogComponent } from './components/workspace-dialog/workspace-dialog.component';
import * as NoteActions from './store/note.actions';
import {
  selectFocusMode, selectQuickSwitcherOpen, selectShortcutsOpen, selectSidebarCollapsed,
  selectWorkspaceExportOpen, selectWorkspaceImportOpen, selectTxtExportOpen,
} from './store/note.selectors';
import { WebmcpService } from './webmcp/webmcp.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    SidebarComponent,
    NoteEditorComponent,
    QuickSwitcherComponent,
    ShortcutsDialogComponent,
    ToastComponent,
    WorkspaceDialogComponent,
  ],
  template: `
    <div class="app-shell"
         [class.focus-mode]="focusMode()"
         [class.sidebar-collapsed]="sidebarCollapsed()">
      <app-sidebar class="sidebar-pane" />
      <app-note-editor class="editor-pane" />
    </div>

    @if (quickSwitcherOpen()) {
      <app-quick-switcher />
    }
    @if (shortcutsOpen()) {
      <app-shortcuts-dialog />
    }
    <app-workspace-dialog />
    <app-toast />
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }

    .app-shell {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }

    .sidebar-pane {
      transition: width 0.08s ease, min-width 0.08s ease, opacity 0.08s ease, transform 0.08s ease;
    }

    .focus-mode .sidebar-pane {
      width: 0 !important;
      min-width: 0 !important;
      overflow: hidden;
      opacity: 0;
    }

    .sidebar-collapsed .sidebar-pane {
      width: 0 !important;
      min-width: 0 !important;
      overflow: hidden;
      opacity: 0;
    }

    .editor-pane {
      flex: 1;
      min-width: 0;
    }

    @media (max-width: 600px) {
      .sidebar-pane {
        position: fixed;
        z-index: 200;
        height: 100%;
        left: 0;
        top: 0;
        width: min(88vw, 280px);
        min-width: min(88vw, 280px);
        transform: translateX(-105%);
        opacity: 1;
        overflow: visible;
      }
      .sidebar-collapsed .sidebar-pane {
        transform: translateX(0);
        width: min(88vw, 280px) !important;
        min-width: min(88vw, 280px) !important;
        opacity: 1;
        overflow: visible;
        box-shadow: 16px 0 40px rgba(0, 0, 0, 0.65);
      }
      .focus-mode .sidebar-pane {
        transform: translateX(-105%);
        width: min(88vw, 280px) !important;
        min-width: min(88vw, 280px) !important;
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private webmcp = inject(WebmcpService);
  private keydownCapture = (event: KeyboardEvent) => this.onKeydown(event);

  constructor() {
    // Register the WebMCP surface on window after the store is initialized.
    this.webmcp.register();
  }

  ngOnInit(): void {
    document.addEventListener('keydown', this.keydownCapture, true);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.keydownCapture, true);
  }

  focusMode = toSignal(this.store.select(selectFocusMode), { initialValue: false });
  quickSwitcherOpen = toSignal(this.store.select(selectQuickSwitcherOpen), { initialValue: false });
  shortcutsOpen = toSignal(this.store.select(selectShortcutsOpen), { initialValue: false });
  sidebarCollapsed = toSignal(this.store.select(selectSidebarCollapsed), { initialValue: false });
  workspaceExportOpen = toSignal(this.store.select(selectWorkspaceExportOpen), { initialValue: false });
  workspaceImportOpen = toSignal(this.store.select(selectWorkspaceImportOpen), { initialValue: false });
  txtExportOpen = toSignal(this.store.select(selectTxtExportOpen), { initialValue: false });

  onKeydown(event: KeyboardEvent) {
    const isMac = /mac/i.test(navigator.platform);
    const ctrl = isMac ? event.metaKey : event.ctrlKey;
    const target = event.target as HTMLElement;
    const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      || target.isContentEditable || !!target.closest('[contenteditable="true"]');

    // Ctrl+K / Cmd+K → Quick Switcher
    if (ctrl && event.key === 'k') {
      event.preventDefault();
      event.stopPropagation();
      if (this.quickSwitcherOpen()) {
        this.store.dispatch(NoteActions.closeQuickSwitcher());
      } else {
        this.store.dispatch(NoteActions.openQuickSwitcher());
      }
      return;
    }

    // Alt+N → New Note
    if (event.altKey && !ctrl && event.key === 'n') {
      event.preventDefault();
      event.stopPropagation();
      this.store.dispatch(NoteActions.createNote());
      this.store.dispatch(NoteActions.showToast({ message: 'Note created' }));
      return;
    }

    // Ctrl+Shift+F → Toggle Focus Mode (case-sensitive F)
    if (ctrl && event.shiftKey && event.key === 'F') {
      event.preventDefault();
      event.stopPropagation();
      this.store.dispatch(NoteActions.toggleFocusMode());
      return;
    }

    // ? → Shortcuts help (not in input)
    if (event.key === '?' && !inInput) {
      event.preventDefault();
      this.store.dispatch(NoteActions.openShortcuts());
      return;
    }

    // Escape → close overlays / exit focus mode
    if (event.key === 'Escape') {
      if (this.workspaceExportOpen()) {
        this.store.dispatch(NoteActions.closeWorkspaceExport());
      } else if (this.workspaceImportOpen()) {
        this.store.dispatch(NoteActions.closeWorkspaceImport());
      } else if (this.txtExportOpen()) {
        this.store.dispatch(NoteActions.closeTxtExport());
      } else if (this.quickSwitcherOpen()) {
        this.store.dispatch(NoteActions.closeQuickSwitcher());
      } else if (this.shortcutsOpen()) {
        this.store.dispatch(NoteActions.closeShortcuts());
      } else if (this.focusMode()) {
        this.store.dispatch(NoteActions.toggleFocusMode());
      }
    }
  }
}
