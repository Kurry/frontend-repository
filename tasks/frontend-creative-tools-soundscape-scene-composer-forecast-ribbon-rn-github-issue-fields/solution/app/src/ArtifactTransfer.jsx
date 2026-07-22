import React, { useState } from 'react';
import { useStore, ACTIONS, STATES } from './store';
import { Download, Upload, Copy, AlertCircle, CheckCircle2, FileJson } from 'lucide-react';
import { format } from 'date-fns';

export function ArtifactTransfer() {
  const { state, dispatch, derived } = useStore();
  const [importText, setImportText] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const generateArtifact = () => {
    return {
      schemaVersion: 'soundscape-scene-v1',
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: derived,
      selectedRecordId: state.selectedRecordId,
      history: state.undoStack.map(h => ({
        recordsCount: h.records.length,
        selectedRecordId: h.selectedRecordId
      }))
    };
  };

  const handleExport = () => {
    const artifact = generateArtifact();
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soundscape-scene-v1-forecast-ribbon.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const artifact = generateArtifact();
    navigator.clipboard.writeText(JSON.stringify(artifact, null, 2));
    setSuccessMsg('Copied to clipboard');
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const validateImport = (parsed) => {
    if (!parsed || typeof parsed !== 'object') return "Invalid JSON object";
    if (parsed.schemaVersion !== 'soundscape-scene-v1') return "Wrong schemaVersion";
    if (!Array.isArray(parsed.records)) return "Missing or invalid records array";

    const ids = new Set();
    for (const r of parsed.records) {
      if (!r.id || !r.name || !r.state || typeof r.duration !== 'number') {
        return "Record missing required fields";
      }
      if (ids.has(r.id)) return "Duplicate record IDs found";
      ids.add(r.id);

      if (!STATES.includes(r.state)) return `Invalid state: ${r.state}`;
      if (r.duration < 0 || r.duration > 3600) return `Invalid duration for ${r.name}`;
      if (r.volume < 0 || r.volume > 100) return `Invalid volume for ${r.name}`;
    }

    return null; // Valid
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      const validationError = validateImport(parsed);

      if (validationError) {
        setError(validationError);
        return;
      }

      // Valid import restores authored structure and regenerates exportedAt.
      dispatch({
        type: ACTIONS.SET_STATE,
        payload: { records: parsed.records, selectedRecordId: parsed.selectedRecordId || null, forecastProjection: null }
      });

      setImportText('');
      setError(null);
      setSuccessMsg('Session imported successfully');
      setTimeout(() => setSuccessMsg(null), 2000);

    } catch (e) {
      setError("Malformed schema: " + e.message);
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-20">
      <div className="max-w-6xl mx-auto grid grid-cols-2 gap-12">

        {/* Export Side */}
        <div>
          <h3 className="text-sm font-bold tracking-wider text-slate-500 uppercase mb-4 flex items-center gap-2">
            <Download className="w-4 h-4" /> Portable Artifact Export
          </h3>
          <p className="text-sm text-slate-600 mb-4">Export the current session state, preserving all authored records and derived consequences.</p>

          <div className="flex gap-3">
             <button
               onClick={handleExport}
               className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-md shadow-sm transition-colors"
             >
               <FileJson className="w-4 h-4" /> Download JSON
             </button>
             <button
               onClick={handleCopy}
               className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-md shadow-sm transition-colors"
             >
               <Copy className="w-4 h-4" /> Copy JSON
             </button>
          </div>
        </div>

        {/* Import Side */}
        <div>
          <h3 className="text-sm font-bold tracking-wider text-slate-500 uppercase mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4" /> Restore Session
          </h3>

          <div className="space-y-3">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste soundscape-scene-v1 JSON here..."
              className="w-full h-24 p-3 text-sm font-mono text-slate-600 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" /> Import Artifact
              </button>

              {error && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded border border-red-100">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-100 transition-all duration-300">
                  <CheckCircle2 className="w-4 h-4" /> {successMsg}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
