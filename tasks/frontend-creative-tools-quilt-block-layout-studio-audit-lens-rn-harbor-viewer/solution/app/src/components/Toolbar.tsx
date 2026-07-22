import React, { useState } from 'react';
import { useStore } from '../store';
import { Undo, Download, Upload, Plus } from 'lucide-react';

export const Toolbar: React.FC = () => {
  const { undo, exportState, importState, addBlock, historyStack } = useStore();
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    const data = exportState();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quilt-layout-v1-audit-lens.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = importState(json);
        if (!res.success) {
          setError(res.error || 'Import failed');
        } else {
          setError(null);
        }
      } catch (err) {
        setError('Invalid JSON file');
      }
      e.target.value = ''; // reset
    };
    reader.readAsText(file);
  };

  const handleAdd = () => {
    addBlock({
      name: 'New Block',
      status: 'draft',
      fabricCount: 0,
      patternType: 'custom'
    });
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Quilt Block Layout Studio</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            Add Block
          </button>
          <button
            onClick={undo}
            disabled={historyStack.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
            Undo
          </button>
          <button
            onClick={handleExport}
            data-testid="export-button"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <label className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer focus-within:ring-2 focus-within:ring-slate-500 focus-within:ring-offset-2">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
              data-testid="import-input"
            />
          </label>
        </div>
      </div>
      {error && (
        <div className="p-2 text-sm text-red-700 bg-red-100 rounded-md border border-red-200" role="alert">
          <strong>Import Error:</strong> {error}
        </div>
      )}
    </div>
  );
};
