import React, { useRef, useState } from 'react';
import { Download, Upload, Trash2, FileJson, AlertTriangle } from 'lucide-react';
import { SessionData, DrumPattern } from '../store';

interface Props {
  data: SessionData;
  onClear: () => void;
  onImport: (records: DrumPattern[]) => void;
}

export function ArtifactPanel({ data, onClear, onImport }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drum-pattern-v1-handoff-map.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result) as SessionData;

        if (parsed.schemaVersion !== 'v1') throw new Error('Invalid schema version. Expected v1.');
        if (!Array.isArray(parsed.records)) throw new Error('Invalid records array.');

        // Basic field-level validation on first record if exists to ensure shape
        if (parsed.records.length > 0) {
            const r = parsed.records[0];
            if (!r.id || !r.status || !Array.isArray(r.beats)) throw new Error('Malformed record shape detected.');
        }

        onImport(parsed.records);
      } catch (err: any) {
        setError(err.message || 'Invalid file format.');
      }
    };
    reader.readAsText(file);
    if (fileInput.current) fileInput.current.value = ''; // reset
  };

  return (
    <div className="bg-slate-800 text-slate-200 p-4 border-l border-slate-700 flex flex-col h-full w-64 flex-shrink-0">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
        <FileJson size={16} /> Artifact
      </h3>

      <div className="space-y-3 mb-6">
        <button onClick={handleExport} className="w-full flex items-center gap-2 justify-center py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium">
          <Download size={16} /> Export JSON
        </button>
        <button onClick={() => fileInput.current?.click()} className="w-full flex items-center gap-2 justify-center py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium border border-slate-600">
          <Upload size={16} /> Import JSON
        </button>
        <input type="file" accept=".json" className="hidden" ref={fileInput} onChange={handleImport} />
        <button onClick={onClear} className="w-full flex items-center gap-2 justify-center py-2 px-4 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors text-sm font-medium">
          <Trash2 size={16} /> Clear Board
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 text-red-200 text-xs rounded-lg border border-red-800 flex items-start gap-2">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="mt-auto">
        <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase">Derived State</h4>
        <div className="bg-slate-900 rounded-lg p-3 text-xs space-y-1 font-mono text-slate-400">
          <div className="flex justify-between"><span>Total:</span> <span className="text-slate-200">{data.derived.summary.total}</span></div>
          <div className="flex justify-between"><span>Ready:</span> <span className="text-slate-200">{data.derived.summary.ready}</span></div>
          <div className="flex justify-between"><span>Assigned:</span> <span className="text-slate-200">{data.derived.summary.assigned}</span></div>
        </div>
      </div>
    </div>
  );
}
