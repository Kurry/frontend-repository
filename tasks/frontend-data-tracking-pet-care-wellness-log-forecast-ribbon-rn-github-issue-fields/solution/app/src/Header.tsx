import React, { useRef } from 'react';
import { useAppStore } from './store';
import { Undo2, Download, Upload, Activity } from 'lucide-react';

export function Header() {
  const undo = useAppStore(state => state.undo);
  const canUndo = useAppStore(state => state.canUndo);
  const exportSession = useAppStore(state => state.exportSession);
  const importSession = useAppStore(state => state.importSession);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const session = exportSession();
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pet-wellness-v1-forecast-ribbon.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const session = JSON.parse(result);
        const success = importSession(session);
        if (!success) {
          alert('Invalid import file. State was not changed.');
        }
      } catch (err) {
        alert('Failed to parse file.');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-600">
          <Activity className="w-5 h-5" />
          <h1 className="font-semibold text-gray-900 tracking-tight">Pet Care Wellness Log</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Undo2 className="w-4 h-4" /> Undo
          </button>

          <div className="w-px h-5 bg-gray-200 mx-2" />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImport}
          />

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>
    </header>
  );
}
