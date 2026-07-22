import React, { useRef } from 'react';
import { useStore } from '../store';
import { Download, Upload, RotateCcw, Trash2, Database } from 'lucide-react';

export const ExportImportBar: React.FC = () => {
  const { undo, clearSession, exportArtifact, importArtifact, history, getDerivedState, seedCollection } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const derived = getDerivedState().summary;

  const handleExport = () => {
    const data = exportArtifact();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenario-builder-v1-handoff-map.json';
    document.body.appendChild(a);
    a.click();
    // Do not immediately removeChild to avoid race conditions in headless browsers
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        importArtifact(event.target.result);
      }
    };
    reader.readAsText(file);
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-card border-b p-4 shadow-sm z-20">
      <div className="flex items-center gap-4 mb-4 sm:mb-0">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          Scenario Builder
        </h1>
        <div className="hidden md:flex gap-3 text-sm text-muted-foreground ml-4 pl-4 border-l">
          <div title="Total">Total: {derived.total}</div>
          <div title="Assigned / Unassigned">
            <span className="text-primary">{derived.assigned}</span> / {derived.unassigned}
          </div>
          <div title="Ready / Draft">
            <span className="text-green-600">{derived.ready}</span> / <span className="text-yellow-600">{derived.draft}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        <button
          onClick={seedCollection}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded transition-colors"
          title="Seed Collection"
        >
          <Database size={16} /> Seed
        </button>
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <RotateCcw size={16} /> Undo
        </button>
        <button
          onClick={clearSession}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded transition-colors"
          title="Clear Session"
        >
          <Trash2 size={16} /> Clear
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImport}
          className="hidden"
          id="import-input"
        />
        <label
          htmlFor="import-input"
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded cursor-pointer transition-colors"
        >
          <Upload size={16} /> Import
        </label>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors"
        >
          <Download size={16} /> Export
        </button>
      </div>
    </div>
  );
};
