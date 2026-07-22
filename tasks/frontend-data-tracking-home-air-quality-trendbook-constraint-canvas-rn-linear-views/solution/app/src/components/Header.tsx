import React, { useRef } from 'react';
import { useAppContext } from '../store';
import { Download, Upload, Undo2, Copy } from 'lucide-react';

export const Header = () => {
  const { state, dispatch } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const payload = {
      schemaVersion: state.schemaVersion,
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'air-quality-v1-constraint-canvas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        dispatch({ type: 'IMPORT_SESSION', payload: json });
      } catch (err) {
        console.error("Failed to parse import file", err);
        alert("Invalid artifact file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
    }
  };

  const handleCopy = () => {
    const payload = {
      schemaVersion: state.schemaVersion,
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(() => {});
  };

  const hasUndo = state.past.length > 0;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm shrink-0 flex-wrap gap-2">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Home Air Quality</h1>
        <div className="hidden md:block h-6 w-px bg-gray-300"></div>
        <span className="hidden md:block text-sm text-gray-500 font-medium">Trendbook</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={!hasUndo}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            hasUndo ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed'
          }`}
          title="Undo last action (Ctrl/Cmd+Z)"
        >
          <Undo2 className="w-4 h-4" />
          <span className="hidden sm:inline">Undo</span>
        </button>

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors"
          title="Copy artifact"
        >
          <Copy className="w-4 h-4" />
          <span className="hidden sm:inline">Copy</span>
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>

        <label className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Import</span>
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImport}
          />
        </label>
      </div>
    </header>
  );
};
