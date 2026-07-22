import { useRef } from 'react';
import { useStore, getDerivedState } from '../store';
import { exportSession, validateAndImportSession } from '../utils/exportImport';
import { Undo, Download, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Toolbar = () => {
  const { undoLastAction, pastStates, clearSession } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const derived = getDerivedState();

  const handleExport = () => {
    const session = exportSession();
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glaze-atlas-v1-constraint-canvas.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Session exported');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const { success, error } = validateAndImportSession(result);
      if (success) {
        toast.success('Session imported successfully');
      } else {
        toast.error(error || 'Import failed');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-stone-900 text-stone-100 p-3 flex justify-between items-center shadow-md z-10 relative">
      <div className="flex items-center space-x-4">
        <h1 className="font-bold tracking-tight">Glaze Test Atlas</h1>
        <div className="text-xs text-stone-400 bg-stone-800 px-2 py-1 rounded">
          {derived.summary} {derived.conflictCount > 0 && <span className="text-red-400 font-bold ml-1">({derived.conflictCount} conflicts)</span>}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={undoLastAction}
          disabled={pastStates.length === 0}
          className="flex items-center space-x-1 px-3 py-1.5 rounded text-sm bg-stone-800 hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Undo last action"
        >
          <Undo size={14} /> <span>Undo</span>
        </button>

        <div className="w-px h-6 bg-stone-700 mx-1"></div>

        <button
          onClick={handleExport}
          className="flex items-center space-x-1 px-3 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-500 transition-colors"
          aria-label="Export session"
        >
          <Download size={14} /> <span>Export</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-1 px-3 py-1.5 rounded text-sm bg-stone-800 hover:bg-stone-700 transition-colors"
          aria-label="Import session"
        >
          <Upload size={14} /> <span>Import</span>
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
          aria-hidden="true"
        />

        <button
          onClick={() => {
              if (window.confirm("Are you sure you want to clear the session?")) {
                  clearSession();
                  toast.success("Session cleared");
              }
          }}
          className="flex items-center space-x-1 px-3 py-1.5 rounded text-sm bg-red-900/50 text-red-300 hover:bg-red-800 transition-colors"
          aria-label="Clear session"
        >
          <Trash2 size={14} /> <span>Clear</span>
        </button>
      </div>
    </div>
  );
};
