import React, { useRef, useState } from 'react';
import { useStore } from './store';
import type { HouseholdWasteDiversionTrackerSession } from './types';
import { Download, Upload, AlertTriangle } from 'lucide-react';

export default function ArtifactTransfer() {
  const { records, history, getDerivedSummary, importSession } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    const session: HouseholdWasteDiversionTrackerSession = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: records,
      derived: {
        summary: getDerivedSummary()
      },
      history: history
    };

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waste-diversion-v1-recovery-board.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        // Field-level validation
        if (json.schemaVersion !== 'v1') {
          throw new Error("Invalid schema version. Expected 'v1'.");
        }
        if (!Array.isArray(json.records)) {
          throw new Error("Invalid format: 'records' must be an array.");
        }

        // Validate records
        const ids = new Set();
        for (const record of json.records) {
          if (!record.id || typeof record.id !== 'string') throw new Error("Missing or invalid record ID.");
          if (ids.has(record.id)) throw new Error(`Duplicate ID found: ${record.id}`);
          ids.add(record.id);

          if (!['draft', 'ready', 'changed', 'archived', 'conflict', 'resolved'].includes(record.status)) {
            throw new Error(`Invalid status enum in record ${record.id}`);
          }
          if (typeof record.weightKg !== 'number' || record.weightKg < 0) {
            throw new Error(`Invalid weight bounds in record ${record.id}`);
          }
        }

        importSession(json);
      } catch (err: any) {
        setError(err.message || 'Failed to parse JSON file');
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const summary = getDerivedSummary();

  return (
    <div className="bg-slate-900 text-slate-200 p-4 rounded shadow flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Derived Summary</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-slate-800 p-2 rounded">
            <div className="text-slate-400 text-xs">Total Weight</div>
            <div className="text-lg font-medium">{summary.totalWeightKg}kg</div>
          </div>
          <div className="bg-slate-800 p-2 rounded">
            <div className="text-slate-400 text-xs">Total Events</div>
            <div className="text-lg font-medium">{summary.totalEvents}</div>
          </div>
          <div className="bg-slate-800 p-2 rounded">
            <div className="text-slate-400 text-xs">Conflict</div>
            <div className="text-lg font-medium text-red-400">{summary.conflictCount}</div>
          </div>
          <div className="bg-slate-800 p-2 rounded">
            <div className="text-slate-400 text-xs">Resolved</div>
            <div className="text-lg font-medium text-green-400">{summary.resolvedCount}</div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700 pt-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Artifact</h3>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <Download size={16} />
            Export
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-slate-500 focus:outline-none"
          >
            <Upload size={16} />
            Import
          </button>
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImport}
          />
        </div>

        {error && (
          <div className="mt-3 p-2 bg-red-900/50 border border-red-800 rounded text-xs text-red-200 flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <div>{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}
