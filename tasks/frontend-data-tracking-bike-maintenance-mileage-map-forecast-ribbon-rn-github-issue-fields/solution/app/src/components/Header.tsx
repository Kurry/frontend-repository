import { useRef } from 'react';
import { useStore } from '../store';
import { Undo, Download, Upload, Trash } from 'lucide-react';

export function Header() {
  const { exportSession, importSession, clearSession, undo, undoStack } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportSession();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bike-maintenance-v1-forecast-ribbon.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) importSession(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="bg-slate-900 text-white p-4 shadow-md flex items-center justify-between">
      <h1 className="text-xl font-bold tracking-tight">Bike Maintenance Mileage Map</h1>

      <div className="flex items-center gap-3">
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
        >
          <Undo className="w-4 h-4" />
          Undo
        </button>

        <div className="h-6 w-px bg-slate-700 mx-1"></div>

        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 rounded transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>

        <button
          onClick={clearSession}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-900/50 hover:bg-red-800/80 text-red-100 rounded transition-colors"
        >
          <Trash className="w-4 h-4" />
          Clear
        </button>
      </div>
    </header>
  );
}
