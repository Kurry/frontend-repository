import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { closeShortcuts } from '../../store/note.actions';

@Component({
  selector: 'app-shortcuts-dialog',
  standalone: true,
  template: `
    <div class="overlay-backdrop" (click)="close()" (keydown.escape)="close()">
      <div class="overlay-panel shortcuts-panel" (click)="$event.stopPropagation()" role="dialog" aria-label="Keyboard shortcuts">
        <div class="shortcuts-header">
          <h2>Keyboard shortcuts</h2>
          <button class="btn-icon" (click)="close()" aria-label="Close shortcuts">✕</button>
        </div>
        <div class="shortcuts-body">
          @for (group of shortcutGroups; track group.title) {
            <div class="shortcut-group">
              <div class="shortcut-group-title">{{ group.title }}</div>
              @for (s of group.shortcuts; track s.key) {
                <div class="shortcut-row">
                  <span class="shortcut-desc">{{ s.desc }}</span>
                  <div class="shortcut-keys">
                    @for (k of s.keys; track k) {
                      <kbd>{{ k }}</kbd>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shortcuts-panel {
      max-width: 520px;
    }
    .shortcuts-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .shortcuts-header h2 {
      font-size: 24px;
      font-weight: 600;
      color: #fff;
    }
    .shortcuts-body {
      padding: 16px 24px 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .shortcut-group-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: rgba(255,255,255,0.4);
      margin-bottom: 10px;
    }
    .shortcut-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
      color: rgba(255,255,255,0.85);
    }
    .shortcut-row + .shortcut-row {
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .shortcut-keys { display: flex; gap: 4px; }
    kbd {
      display: inline-block;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 5px;
      padding: 3px 8px;
      font-size: 12px;
      font-family: 'Roboto Mono', monospace;
      color: #fff;
      min-width: 28px;
      text-align: center;
    }
  `]
})
export class ShortcutsDialogComponent {
  private store = inject(Store);

  shortcutGroups = [
    {
      title: 'Editor',
      shortcuts: [
        { desc: 'Bold', keys: ['Ctrl', 'B'], key: 'bold' },
        { desc: 'Italic', keys: ['Ctrl', 'I'], key: 'italic' },
        { desc: 'Undo', keys: ['Ctrl', 'Z'], key: 'undo' },
        { desc: 'Redo', keys: ['Ctrl', 'Y'], key: 'redo' },
      ]
    },
    {
      title: 'Notes',
      shortcuts: [
        { desc: 'New note', keys: ['Alt', 'N'], key: 'new' },
        { desc: 'Quick switcher', keys: ['Ctrl', 'K'], key: 'qs' },
        { desc: 'Toggle focus mode', keys: ['Ctrl', 'Shift', 'F'], key: 'focus' },
        { desc: 'Show shortcuts', keys: ['?'], key: 'shortcuts' },
      ]
    },
    {
      title: 'Navigation',
      shortcuts: [
        { desc: 'Close overlay / exit focus mode', keys: ['Esc'], key: 'esc' },
        { desc: 'Navigate quick switcher', keys: ['↑ / ↓'], key: 'nav' },
        { desc: 'Open selected note', keys: ['Enter'], key: 'enter' },
      ]
    },
  ];

  close() {
    this.store.dispatch(closeShortcuts());
  }
}
