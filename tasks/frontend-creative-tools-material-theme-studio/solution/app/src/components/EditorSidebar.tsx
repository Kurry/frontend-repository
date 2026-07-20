import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import Editor from '@monaco-editor/react';
import { toEditorSource, parseEditorSource } from '../utils/themeCompiler';
import { announce, updateActiveOptions, setTool, undo, redo, saveTheme } from '../store/themeSlice';
import ThemeTools from './ThemeTools';
import { ToastView, useToast } from './Toast';

export default function EditorSidebar() {
  const dispatch = useDispatch();
  const activeOptions = useSelector((state: RootState) => state.theme.activeOptions);
  const activeId = useSelector((state: RootState) => state.theme.activeId);
  const tool = useSelector((state: RootState) => state.theme.tool);
  const undoStack = useSelector((state: RootState) => state.theme.undoStack);
  const redoStack = useSelector((state: RootState) => state.theme.redoStack);
  const dirty = useSelector((state: RootState) => state.theme.dirty);

  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [editorValue, setEditorValue] = useState('');
  const [status, setStatus] = useState(dirty ? 'Unsaved' : 'All changes saved');
  const { toast, show } = useToast();
  const syncRef = useRef(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeOptionsRef = useRef(activeOptions);
  const copyBusyRef = useRef(false);
  activeOptionsRef.current = activeOptions;

  useEffect(() => {
    // The status span below carries role="status", so this change is announced
    // without clobbering the shared polite live region used for richer messages.
    setStatus(dirty ? 'Unsaved' : 'All changes saved');
  }, [dirty]);

  useEffect(() => {
    if (syncRef.current) return;
    setEditorValue(toEditorSource(activeOptions));
  }, [activeOptions]);

  useEffect(() => () => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
  }, []);

  const cancelPendingEditorSync = () => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = null;
    syncRef.current = false;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setEditorValue(value);
    syncRef.current = true;
    setStatus('Editing…');

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      try {
        const defaultO = JSON.parse(JSON.stringify(activeOptionsRef.current));
        const parsed = parseEditorSource(value, defaultO);
        dispatch(updateActiveOptions(parsed));
        const synced = 'Synced from editor';
        setStatus(synced);
        dispatch(announce(synced));
      } catch (err) {
        setEditorValue(toEditorSource(activeOptionsRef.current));
        const invalid = 'Invalid ThemeOptions — nothing applied, preview keeps the last valid theme';
        setStatus(invalid);
        dispatch(announce(invalid));
      } finally {
        syncRef.current = false;
        syncTimeoutRef.current = null;
      }
    }, 400);
  };

  const copyCode = () => {
    if (copyBusyRef.current) return;
    copyBusyRef.current = true;
    const text = editorValue || toEditorSource(activeOptions);
    navigator.clipboard
      .writeText(text)
      .then(() => {
        show('Theme code copied');
        dispatch(announce('Theme code copied to clipboard'));
      })
      .catch(() => {
        show('Copy failed — clipboard unavailable');
      })
      .finally(() => {
        setTimeout(() => {
          copyBusyRef.current = false;
        }, 500);
      });
  };

  const actionButton =
    'flex items-center gap-1 whitespace-nowrap min-h-11 px-2 rounded transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-400';

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="h-1/2 border-b border-gray-700 flex flex-col min-h-0">
        <div className="flex items-center gap-1 p-2 bg-gray-900 border-b border-gray-700 text-sm overflow-x-auto">
          <button
            type="button"
            className={`${actionButton} text-gray-400 hover:text-white hover:bg-gray-800`}
            onClick={() => {
              const next = editorTheme === 'vs-dark' ? 'light' : 'vs-dark';
              setEditorTheme(next);
              show(`Editor color theme: ${next === 'vs-dark' ? 'dark' : 'light'}`);
              dispatch(announce(`Editor color theme set to ${next === 'vs-dark' ? 'dark' : 'light'}`));
            }}
            title="Editor Settings"
            aria-label="Editor Settings — toggle editor color theme"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">settings</span> Settings
          </button>
          <button
            type="button"
            className={`${actionButton} text-gray-400 hover:text-white hover:bg-gray-800`}
            onClick={copyCode}
            title="Copy theme code"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">content_copy</span> Copy theme code
          </button>
          <button
            type="button"
            className={`${actionButton} ${undoStack.length ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 cursor-not-allowed opacity-50'}`}
            onClick={() => {
              cancelPendingEditorSync();
              dispatch(undo());
            }}
            disabled={!undoStack.length}
            title="Undo"
            aria-label="Undo"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">undo</span>
          </button>
          <button
            type="button"
            className={`${actionButton} ${redoStack.length ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 cursor-not-allowed opacity-50'}`}
            onClick={() => {
              cancelPendingEditorSync();
              dispatch(redo());
            }}
            disabled={!redoStack.length}
            title="Redo"
            aria-label="Redo"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">redo</span>
          </button>
          <button
            type="button"
            className={`${actionButton} ${activeId ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-800' : 'text-gray-600 cursor-not-allowed opacity-50'}`}
            onClick={() => {
              if (!activeId) return;
              dispatch(saveTheme());
              show('Theme saved');
              dispatch(announce('Theme saved — status: All changes saved'));
            }}
            disabled={!activeId}
            title={activeId ? 'Save' : 'Select or create a theme before saving'}
            aria-label="Save"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">save</span>
          </button>
          <span className="text-gray-400 ml-auto whitespace-nowrap px-2" role="status" aria-live="polite">
            {status}
          </span>
        </div>
        <div className="flex-1 relative min-h-0">
          <Editor
            language="typescript"
            theme={editorTheme}
            value={editorValue}
            onChange={handleEditorChange}
            onMount={(editor, monaco) => {
              // Monaco reserves Cmd/Ctrl+K as a chord leader; delegate it to the
              // app-level command palette instead of swallowing it.
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
                window.dispatchEvent(
                  new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
                );
              });
            }}
            options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', automaticLayout: true }}
          />
        </div>
      </div>
      <div className="h-1/2 flex flex-col relative min-h-0 bg-gray-900">
        <div className="flex-1 overflow-auto bg-gray-900">
          <ThemeTools />
        </div>
        <div className="flex border-t border-gray-700 bg-gray-900" role="tablist" aria-label="Theme tools">
          {(['palette', 'fonts', 'typography', 'snippets'] as const).map(t => (
            <button
              type="button"
              key={t}
              role="tab"
              aria-selected={tool === t}
              className={`flex-1 py-2 text-center flex flex-col items-center gap-1 text-xs transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-h-[44px] ${tool === t ? 'text-blue-400 bg-gray-800/60' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'}`}
              onClick={() => dispatch(setTool(t))}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                {t === 'palette' ? 'palette' : t === 'fonts' ? 'text_fields' : t === 'typography' ? 'format_size' : 'playlist_add'}
              </span>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <ToastView toast={toast} />
    </div>
  );
}
