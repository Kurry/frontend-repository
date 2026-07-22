import { useRef, useState } from 'react';
import { useAppStore, store, useDerivedSummary } from '../store';
import { EvacuationSession } from '../types';
import { Download, Upload, Trash2 } from 'lucide-react';

export function ArtifactTools() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { checkpoints } = useAppStore();
  const summary = useDerivedSummary();
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const session: EvacuationSession = {
      schemaVersion: "evacuation-drill-v1",
      exportedAt: new Date().toISOString(),
      records: checkpoints,
      derived: summary,
      history: []
    };

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'evacuation-drill-v1.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm("Clear all checkpoints and state?")) {
      store.clear();
      setImportError(null);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const session: EvacuationSession = JSON.parse(content);

        if (session.schemaVersion !== "evacuation-drill-v1") {
          throw new Error("Invalid schemaVersion");
        }

        if (!Array.isArray(session.records)) throw new Error("Invalid records format");

        const ids = new Set();
        for (const r of session.records) {
           if (!r.id || ids.has(r.id)) throw new Error("Duplicate or missing ID");
           ids.add(r.id);
           if (typeof r.predicted_time !== 'number' || typeof r.headcount !== 'number' || r.predicted_time < 0) {
             throw new Error("Invalid bounds in records");
           }
        }

        store.importData(session);
        setImportError(null);
      } catch (err: any) {
        setImportError("Import failed: " + err.message);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-gray-800 text-white p-2 flex items-center justify-between text-sm shadow-md z-10">
      <div className="flex items-center gap-4 px-2">
        <h1 className="font-bold tracking-wide">Emergency Drill Planner</h1>
        {importError && (
          <span className="text-red-400 bg-red-900/50 px-2 py-0.5 rounded text-xs">{importError}</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="file"
          accept=".json"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImport}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 hover:bg-gray-700 px-3 py-1.5 rounded transition-colors cursor-pointer"
        >
          <Upload size={14} /> Import
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors cursor-pointer"
        >
          <Download size={14} /> Export
        </button>
        <div className="w-px h-6 bg-gray-600 mx-1 self-center"></div>
        <button
          onClick={handleClear}
          className="flex items-center gap-1 text-red-400 hover:bg-gray-700 hover:text-red-300 px-3 py-1.5 rounded transition-colors cursor-pointer"
        >
          <Trash2 size={14} /> Clear
        </button>
      </div>
    </div>
  );
}
