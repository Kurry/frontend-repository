import React, { useState } from 'react';
import { useStore, store } from '../store';
import { Download, Upload, Trash, RefreshCw } from 'lucide-react';
import { z } from 'zod';

const schema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    status: z.enum(['empty', 'draft', 'ready', 'changed', 'archived']),
    date: z.string(),
    capacity: z.number().min(1)
  })),
  derived: z.object({
    summary: z.object({
      total: z.number(),
      totalCapacity: z.number()
    }),
    spatialGeometry: z.record(z.object({
      x: z.number(),
      y: z.number()
    }))
  }),
  history: z.array(z.any())
});

export default function ArtifactPanel() {
  const state = useStore(s => s);
  const [importError, setImportError] = useState('');

  const derivedSummary = {
      total: state.records.length,
      totalCapacity: state.records.reduce((sum, r) => sum + r.capacity, 0)
  };

  const handleExport = () => {
    const artifact = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: {
        summary: derivedSummary,
        spatialGeometry: state.spatialGeometry
      },
      history: state.undoStack
    };

    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appliance-service-v1-spatial-composer.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Clear all session data?')) {
        store.dispatch({ type: 'CLEAR_STATE' });
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        const parsed = schema.parse(json);

        // Reconstruct state
        store.dispatch({
            type: 'IMPORT_STATE',
            payload: {
                records: parsed.records,
                spatialGeometry: parsed.derived.spatialGeometry,
                history: [],
                undoStack: parsed.history,
                filter: 'all',
                selectedRecordId: null
            }
        });
        setImportError('');
      } catch (err) {
        setImportError('Invalid artifact schema.');
        console.error(err);
      }
      e.target.value = null; // reset input
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      <div className="p-4 border-b border-slate-200 shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">Artifact Inspector</h2>
      </div>

      <div className="p-4 border-b border-slate-200 shrink-0 bg-slate-50 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-white p-2 rounded border">
                <div className="text-slate-500 text-xs">Total Records</div>
                <div className="font-semibold text-slate-800">{derivedSummary.total}</div>
            </div>
            <div className="bg-white p-2 rounded border">
                <div className="text-slate-500 text-xs">Total Capacity</div>
                <div className="font-semibold text-slate-800">{derivedSummary.totalCapacity}</div>
            </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
            <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors"
            >
                <Download className="w-4 h-4" /> Export Artifact
            </button>

            <div className="relative w-full">
                <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Import Artifact"
                />
                <button className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors">
                    <Upload className="w-4 h-4" /> Import Artifact
                </button>
            </div>

            <button
                onClick={handleClear}
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors"
            >
                <Trash className="w-4 h-4" /> Clear Session
            </button>
        </div>

        {importError && (
            <div className="text-red-500 text-xs mt-2 p-2 bg-red-50 rounded border border-red-200">
                {importError}
            </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 text-xs font-mono text-slate-600">
        <div className="mb-2 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Derived Live State Preview</div>
        <pre className="bg-slate-900 text-green-400 p-3 rounded overflow-x-auto">
            {JSON.stringify({
                schemaVersion: 'v1',
                records: state.records.length > 5 ? state.records.slice(0, 5).concat([{id: '...'}]) : state.records,
                derived: {
                    summary: derivedSummary,
                    spatialGeometry: Object.keys(state.spatialGeometry).length > 5
                        ? { preview: '...' }
                        : state.spatialGeometry
                }
            }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
