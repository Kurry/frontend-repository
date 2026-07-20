import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '../store';
import { optionsToSource } from '../domain';
import { Icon, Modal } from './primitives';

function ToolbarButton({
  onClick,
  disabled,
  label,
  icon,
  text
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  icon: string;
  text?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="lift flex items-center gap-1 px-2 py-1.5 rounded-md bg-shell-2 hover:bg-shell-3 text-shell-text text-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-shell-2"
    >
      <Icon name={icon} style={{ fontSize: 16 }} />
      {text && <span className="hidden md:inline">{text}</span>}
    </button>
  );
}

export function EditorPane() {
  const source = useStore((s) => s.source);
  const setSource = useStore((s) => s.setSource);
  const sourceError = useStore((s) => s.sourceError);
  const saveStatus = useStore((s) => s.saveStatus);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.canUndo());
  const canRedo = useStore((s) => s.canRedo());
  const history = useStore((s) => s.history);
  const historyIndex = useStore((s) => s.historyIndex);
  const gotoHistory = useStore((s) => s.gotoHistory);
  const copyText = useStore((s) => s.copyText);
  const saveActive = useStore((s) => s.saveActiveOptions);
  const activeThemeId = useStore((s) => s.activeThemeId);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
  const [minimap, setMinimap] = useState(false);

  const formatSource = () => {
    const s = useStore.getState();
    s.setSource(optionsToSource(s.options));
    s.pushToast('Theme source formatted');
  };

  return (
    <section
      className="flex flex-col bg-shell-1 rounded-xl border border-shell-border overflow-hidden"
      aria-label="Theme source editor"
      onKeyDown={(e) => {
        // Keyboard undo/redo for theme history when focus is on the toolbar or
        // timeline (inside the Monaco surface, the same shortcuts are bound to
        // the same store commands via addCommand).
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'TEXTAREA' || tag === 'INPUT') return;
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && e.shiftKey) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y')) {
          e.preventDefault();
          redo();
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-shell-border">
        <h2 className="text-sm font-medium text-shell-text mr-1">Theme Source</h2>
        <ToolbarButton label="Editor Settings" icon="settings" onClick={() => setSettingsOpen(true)} />
        <ToolbarButton
          label="Copy Theme Code"
          icon="content_copy"
          text="Copy"
          onClick={() => copyText(source, 'Theme code')}
        />
        <ToolbarButton label="Format Source" icon="format_align_left" text="Format" onClick={formatSource} />
        <ToolbarButton label="Undo" icon="undo" onClick={undo} disabled={!canUndo} />
        <ToolbarButton label="Redo" icon="redo" onClick={redo} disabled={!canRedo} />
        <ToolbarButton
          label="Save Options To Theme"
          icon="save"
          text="Save"
          onClick={saveActive}
          disabled={!activeThemeId}
        />
        <span className="ml-auto text-xs text-shell-muted" role="status" data-testid="save-status">
          {saveStatus}
        </span>
      </div>

      {/* History timeline scrubber */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-shell-border bg-shell">
        <Icon name="history" style={{ fontSize: 16 }} className="text-shell-muted" />
        <input
          type="range"
          min={0}
          max={Math.max(0, history.length - 1)}
          value={historyIndex}
          onChange={(e) => gotoHistory(Number(e.target.value))}
          aria-label="History timeline"
          className="flex-1 accent-[var(--color-accent)]"
        />
        <span className="text-xs text-shell-muted whitespace-nowrap" data-testid="history-label">
          State {historyIndex + 1} of {history.length}
        </span>
      </div>

      <div className="relative" style={{ height: 320 }}>
        <Editor
          height="320px"
          defaultLanguage="typescript"
          language="typescript"
          theme="vs-dark"
          value={source}
          onChange={(v) => setSource(v ?? '')}
          onMount={(editor, monacoNs) => {
            // Bind the studio's keyboard undo/redo + format shortcuts inside the
            // editor surface to the shared theme history.
            editor.addCommand(monacoNs.KeyMod.CtrlCmd | monacoNs.KeyCode.KeyZ, () => useStore.getState().undo());
            editor.addCommand(monacoNs.KeyMod.CtrlCmd | monacoNs.KeyMod.Shift | monacoNs.KeyCode.KeyZ, () => useStore.getState().redo());
            editor.addCommand(monacoNs.KeyMod.CtrlCmd | monacoNs.KeyCode.KeyY, () => useStore.getState().redo());
            editor.addCommand(monacoNs.KeyMod.CtrlCmd | monacoNs.KeyMod.Shift | monacoNs.KeyCode.KeyF, () => formatSource());
          }}
          options={{
            wordWrap,
            minimap: { enabled: minimap },
            fontSize: 13,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            readOnly: false
          }}
        />
      </div>
      {sourceError ? (
        <div className="px-3 py-2 text-xs text-red-300 bg-red-950/40 border-t border-red-900" role="alert" data-testid="source-diagnostics">
          <Icon name="error" style={{ fontSize: 14 }} className="align-middle mr-1" />
          {sourceError}
        </div>
      ) : (
        <div className="px-3 py-2 text-xs text-shell-muted border-t border-shell-border" data-testid="source-diagnostics-ok">
          No diagnostics — source is valid.
        </div>
      )}

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} labelledBy="editor-settings-title" width={420}>
        <div className="p-5">
          <h2 id="editor-settings-title" className="text-lg font-semibold mb-4">
            Editor Settings
          </h2>
          <label className="flex items-center justify-between py-2 text-sm">
            Word Wrap
            <input type="checkbox" checked={wordWrap === 'on'} onChange={(e) => setWordWrap(e.target.checked ? 'on' : 'off')} />
          </label>
          <label className="flex items-center justify-between py-2 text-sm">
            Minimap
            <input type="checkbox" checked={minimap} onChange={(e) => setMinimap(e.target.checked)} />
          </label>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="lift bg-accent hover:bg-accent-strong text-white px-4 py-2 rounded-md text-sm"
              onClick={() => setSettingsOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
