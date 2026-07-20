import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { Download, Upload, Keyboard, RotateCcw, RotateCw } from 'lucide-react';
import { undo, redo, templates, applyTemplate, collectionHistoryIndexStore, collectionHistoryStore } from '../store';
import { ExportDrawer } from './ExportDrawer';
import { CommandPalette } from './CommandPalette';

export function WorkspaceHeader() {
  const [exportOpen, setExportOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const historyIndex = useStore(collectionHistoryIndexStore);
  const history = useStore(collectionHistoryStore);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Set up command palette shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className="flex items-center justify-between py-2 px-6 border-b border-gray-200 bg-white shadow-sm" aria-label="Workspace Tools">
        <div className="flex items-center gap-2">
          <div className="dropdown dropdown-bottom">
            <button tabIndex={0} className="btn btn-sm btn-ghost gap-2 font-medium">
              Templates
            </button>
            <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-52">
              {templates.map((tpl, i) => (
                <li key={i}>
                  <button onClick={() => applyTemplate(i)}>{tpl.name}</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="divider divider-horizontal mx-1 my-1 w-[1px]"></div>

          <button
            className="btn btn-sm btn-ghost btn-circle"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            className="btn btn-sm btn-ghost btn-circle"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-sm btn-outline gap-2"
            onClick={() => setPaletteOpen(true)}
            aria-haspopup="dialog"
          >
            <Keyboard className="w-4 h-4" />
            <span className="hidden sm:inline">Cmd K</span>
          </button>

          <button
            className="btn btn-sm btn-outline gap-2 inert-nav"
            aria-label="Import package"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>

          <button
            className="btn btn-sm bg-gray-900 text-white hover:bg-gray-800 gap-2"
            onClick={() => setExportOpen(true)}
            aria-haspopup="dialog"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <ExportDrawer isOpen={exportOpen} onClose={() => setExportOpen(false)} />
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
