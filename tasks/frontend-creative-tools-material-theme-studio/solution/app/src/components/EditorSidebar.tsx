import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import Editor from '@monaco-editor/react';
import { toEditorSource, parseEditorSource } from '../utils/themeCompiler';
import { updateActiveOptions, setTool, undo, redo, saveTheme } from '../store/themeSlice';
import ThemeTools from './ThemeTools';

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
  const [toastMsg, setToastMsg] = useState('');
  const syncRef = useRef(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeOptionsRef = useRef(activeOptions);
  activeOptionsRef.current = activeOptions;

  useEffect(() => {
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
    if (!value) return;
    setEditorValue(value);
    syncRef.current = true;
    setStatus('Editing…');

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
        try {
            const defaultO = JSON.parse(JSON.stringify(activeOptionsRef.current));
            const parsed = parseEditorSource(value, defaultO);
            dispatch(updateActiveOptions(parsed));
            setStatus('Synced from editor');
        } catch (err) {
            setEditorValue(toEditorSource(activeOptionsRef.current));
            setStatus('Invalid ThemeOptions — restored last valid theme');
        } finally {
            syncRef.current = false;
            syncTimeoutRef.current = null;
        }
    }, 400);
  };

  const copyCode = () => {
    const text = editorValue || toEditorSource(activeOptions);
    navigator.clipboard.writeText(text).then(() => {
      setToastMsg('Theme code copied');
      setTimeout(() => setToastMsg(''), 3000);
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="h-1/2 border-b border-gray-700 flex flex-col relative min-h-0">
        <div className="flex items-center gap-2 p-2 bg-gray-900 border-b border-gray-700 text-sm overflow-x-auto">
          <button
            className="flex items-center gap-1 text-gray-400 hover:text-white whitespace-nowrap min-h-11 min-w-11 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            onClick={() => {
                setEditorTheme(prev => prev === 'vs-dark' ? 'light' : 'vs-dark');
                setToastMsg(`Editor: ${editorTheme === 'vs-dark' ? 'light' : 'dark'}`);
                setTimeout(() => setToastMsg(''), 3000);
            }}
            title="Editor Settings"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span> Settings
          </button>
          <button
            className="flex items-center gap-1 text-gray-400 hover:text-white whitespace-nowrap min-h-11 min-w-11 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            onClick={copyCode}
            title="Copy theme code"
          >
            <span className="material-symbols-outlined text-[18px]">content_copy</span> Copy theme code
          </button>
          <button
            className={`px-2 min-h-11 min-w-11 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${undoStack.length ? 'text-gray-400 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
            onClick={() => {
              cancelPendingEditorSync();
              dispatch(undo());
            }}
            disabled={!undoStack.length}
            title="Undo"
          >
            <span className="material-symbols-outlined text-[18px]">undo</span>
          </button>
          <button
            className={`px-2 min-h-11 min-w-11 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${redoStack.length ? 'text-gray-400 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
            onClick={() => {
              cancelPendingEditorSync();
              dispatch(redo());
            }}
            disabled={!redoStack.length}
            title="Redo"
          >
            <span className="material-symbols-outlined text-[18px]">redo</span>
          </button>
          <button
            className={`px-2 min-h-11 min-w-11 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${activeId ? 'text-blue-400 hover:text-blue-300' : 'text-gray-600 cursor-not-allowed'}`}
            onClick={() => {
              if (!activeId) return;
              dispatch(saveTheme());
              setToastMsg('Theme saved');
              setTimeout(() => setToastMsg(''), 3000);
            }}
            disabled={!activeId}
            title={activeId ? 'Save' : 'Select or create a theme before saving'}
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
          </button>
          <span className="text-gray-400 ml-auto whitespace-nowrap px-2" role="status" aria-live="polite">{status}</span>
        </div>
        <div className="flex-1 relative">
            <Editor
                language="typescript"
                theme={editorTheme}
                value={editorValue}
                onChange={handleEditorChange}
                options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: "on" }}
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
                key={t}
                className={`flex-1 py-2 text-center flex flex-col items-center gap-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-h-[44px] ${tool === t ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
                onClick={() => dispatch(setTool(t))}
               >
                 <span className="material-symbols-outlined text-[20px]">{t === 'palette' ? 'palette' : t === 'fonts' ? 'text_fields' : t === 'typography' ? 'format_size' : 'playlist_add'}</span>
                 {t.charAt(0).toUpperCase() + t.slice(1)}
               </button>
           ))}
        </div>
      </div>

      {toastMsg && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50 transition-all duration-300 transform translate-y-0 opacity-100" role="status" aria-live="polite">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
