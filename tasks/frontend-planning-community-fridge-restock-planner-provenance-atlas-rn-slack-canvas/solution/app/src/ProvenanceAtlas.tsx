import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { Store } from './store.js';
import { Download, Upload, Copy, Undo, AlertTriangle, ShieldCheck } from 'lucide-react';

export function ProvenanceAtlas({ store }: { store: Store }) {
  const [importJson, setImportJson] = useState('');

  const selectedRecord = store.records.find(r => r.id === store.selectedId);

  const handleQuarantine = () => {
    if (store.selectedId) {
      store.traceAndQuarantine(store.selectedId);
    }
  };

  const handleExport = () => {
    const data = store.exportArtifact();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fridge-restock-v1.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    store.importArtifact(importJson);
    setImportJson('');
  };

  return (
    <div className="flex flex-col gap-4 border p-4 rounded bg-slate-100 h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck /> Provenance Atlas</h2>
        <div className="flex gap-2">
          <button onClick={store.undo} className="flex items-center gap-1 bg-gray-200 px-3 py-1 rounded hover:bg-gray-300" title="Undo (Ctrl+Z)">
            <Undo size={16}/> Undo
          </button>
          <button onClick={store.seed} className="bg-emerald-600 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-emerald-700 transition-colors">Seed</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 flex-grow overflow-hidden">
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          <h3 className="font-semibold text-gray-700">Record Lineage</h3>
          {store.records.map(r => (
            <motion.div
              key={r.id}
              layout
              onClick={() => store.selectLineage(r.id)}
              className={`p-3 border rounded cursor-pointer transition-colors ${store.selectedId === r.id ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300 hover:bg-gray-50'} ${r.lineageState === 'conflict' ? 'border-red-400 bg-red-50' : ''}`}
            >
              <div className="flex justify-between">
                <span className="font-bold">{r.name}</span>
                <span className="text-xs uppercase px-2 py-0.5 rounded bg-gray-200">{r.lineageState}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">Source: {r.source} | Qty: {r.quantity}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-4 bg-white p-4 border rounded shadow-inner">
          <h3 className="font-semibold text-gray-700">Trace Inspector</h3>
          {selectedRecord ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
              <div className="text-lg font-bold">{selectedRecord.name}</div>
              <div className="text-sm bg-blue-50 p-2 rounded text-blue-800 border border-blue-200">
                Tracking source evidence for <strong>{selectedRecord.source}</strong>.
              </div>
              <div className="text-sm text-gray-600">Current Status: {selectedRecord.status}</div>

              <button onClick={handleQuarantine} className="mt-4 flex justify-center items-center gap-2 bg-red-600 text-white p-2 rounded hover:bg-red-700 focus:ring focus:ring-red-300 transition-all">
                <AlertTriangle size={18} /> Trace & Quarantine Lineage
              </button>
            </motion.div>
          ) : (
            <div className="text-gray-400 italic text-sm mt-4 text-center">Select a record to trace its lineage.</div>
          )}

          <div className="mt-auto pt-4 border-t flex flex-col gap-2">
             <div className="font-semibold text-sm">Summary</div>
             <div className="text-sm bg-gray-100 p-2 rounded">{store.derived.summary} (Total Qty: {store.derived.totalQuantity})</div>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 flex flex-col gap-2">
        <h3 className="font-semibold text-gray-700">Portable Artifact</h3>
        <div className="flex gap-2 items-center">
          <button onClick={handleExport} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm">
            <Download size={16} /> Export JSON
          </button>
          <button onClick={store.clear} className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm">Clear Board</button>
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border p-1 text-sm rounded font-mono"
            placeholder="Paste JSON artifact to import..."
            value={importJson}
            onChange={e => setImportJson(e.target.value)}
          />
          <button onClick={handleImport} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm">
            <Upload size={16} /> Import
          </button>
        </div>
      </div>
    </div>
  );
}
