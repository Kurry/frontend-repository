import React, { useRef, useState } from 'react';
import { useAppStore } from '../store';
import { Download, Upload, Undo2, Trash } from 'lucide-react';

export function ArtifactManager() {
  const { exportArtifact, importArtifact, undo, history, clear } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = () => {
    const data = exportArtifact();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'practice-loop-v1-handoff-map.json';
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
        const result = importArtifact(json);
        if (!result.success) {
          setErrorMsg("Invalid artifact format.");
        } else {
          setErrorMsg(null);
        }
      } catch (err) {
        setErrorMsg("Failed to parse JSON.");
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-900 text-slate-300 p-3 flex justify-between items-center shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="font-semibold text-white">Music Practice Loop Composer</h1>
        <div className="h-4 w-px bg-slate-700"></div>
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-sm"
          aria-label="Undo"
        >
          <Undo2 size={16} /> Undo
        </button>
      </div>

      <div className="flex items-center gap-2">
        {errorMsg && <span className="text-red-400 text-xs mr-2">{errorMsg}</span>}

        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-slate-800 text-sm transition-colors"
          aria-label="Clear All"
        >
          <Trash size={16} /> Clear
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-sm transition-colors"
          aria-label="Import Artifact"
        >
          <Upload size={16} /> Import
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImport}
        />

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors"
          aria-label="Export Artifact"
        >
          <Download size={16} /> Export
        </button>
      </div>
    </div>
  );
}
