import React, { useRef } from 'react';
import { Download, Upload, Undo2, Briefcase } from 'lucide-react';
import type { DerivedState } from '../types';

interface HeaderProps {
  exportData: () => any;
  importData: (data: any) => void;
  derived: DerivedState;
  undo: () => void;
  canUndo: boolean;
}

export function Header({ exportData, importData, derived, undo, canUndo }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carry-on-pack-v1-scenario-weaver.json';
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
        const json = JSON.parse(event.target?.result as string);
        importData(json);
      } catch (err) {
        console.error("Failed to parse JSON", err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header className="bg-slate-900 border-b border-slate-700 py-4 px-6 sticky top-0 z-10 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-indigo-400">
          <Briefcase className="w-8 h-8" />
          <h1 className="text-2xl font-bold text-white tracking-tight">PackOpt<span className="text-indigo-400">.</span></h1>
        </div>

        <div className="flex items-center gap-6 bg-slate-800/50 px-6 py-2 rounded-full border border-slate-700">
          <div className="text-center">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Weight</div>
            <div className="text-lg font-mono text-white">{derived.totalWeight}g</div>
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <div className="text-center">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Items</div>
            <div className="text-lg font-mono text-white">{derived.totalItems}</div>
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <div className="text-center">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Ready</div>
            <div className="text-lg font-mono text-emerald-400">{derived.readyItems}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Undo last action"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-slate-700 mx-2"></div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </header>
  );
}
