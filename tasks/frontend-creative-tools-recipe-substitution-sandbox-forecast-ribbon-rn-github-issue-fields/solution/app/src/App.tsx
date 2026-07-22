import React, { useRef, useState } from 'react';
import { useStore, getDerivedState } from './store';
import { ForecastRibbon } from './components/ForecastRibbon';
import { RecipeIngredients } from './components/RecipeIngredients';
import { Download, Upload, AlertCircle, FileText } from 'lucide-react';

import { useEffect } from 'react';

function App() {
  const { records, exportedAt, exportSession, importSession, undo } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const derivedState = getDerivedState(records);

  const handleExport = () => {
    exportSession();

    // We get fresh state after exportSession call
    const currentState = useStore.getState();
    const dataStr = JSON.stringify({
      schemaVersion: 'v1',
      exportedAt: currentState.exportedAt,
      records: currentState.records,
    }, null, 2);

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recipe-substitution-v1.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.schemaVersion !== 'v1') throw new Error('Invalid schema version');
        importSession(json);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        setImportError('Invalid or malformed artifact.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar: Collection */}
      <div className="w-full md:w-80 h-1/2 md:h-full bg-white shadow-lg z-10 shrink-0 flex flex-col">
        <RecipeIngredients />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-1/2 md:h-full overflow-hidden relative">

        {/* Top Header / App Chrome */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold shadow-sm">
              <FileText size={18} />
            </div>
            <h1 className="font-bold tracking-tight text-slate-800">Recipe Substitution Sandbox</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                className="hidden"
                accept=".json"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                <Upload size={16} /> Import Artifact
              </button>

              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-md transition-colors shadow-sm"
              >
                <Download size={16} /> Export
              </button>
            </div>
          </div>
        </header>

        {importError && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md shadow-md flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">{importError}</span>
            <button onClick={() => setImportError(null)} className="ml-2 text-red-500 hover:text-red-800">×</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* Canonical Signature View */}
          <ForecastRibbon />

          {/* Derived / Project Evidence Surface */}
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 flex items-baseline justify-between">
                <h2 className="text-2xl font-semibold text-slate-800">Project Evidence Surface</h2>
                {exportedAt && (
                  <div className="text-xs text-slate-500 bg-slate-200/50 px-2.5 py-1 rounded-full border border-slate-200">
                    Last exported: {new Date(exportedAt).toLocaleTimeString()}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="text-sm font-medium text-slate-500 mb-1">Active Ingredients</div>
                  <div className="text-3xl font-bold text-slate-800">{derivedState.totalOriginalIngredients}</div>
                  <div className="mt-2 text-xs text-slate-400">Total ready or changed</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="text-sm font-medium text-slate-500 mb-1">Active Substitutions</div>
                  <div className="text-3xl font-bold text-amber-600">{derivedState.totalSubstitutions}</div>
                  <div className="mt-2 text-xs text-slate-400">Items currently altered</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="text-sm font-medium text-slate-500 mb-1">Net Cost Forecast</div>
                  <div className={`text-3xl font-bold ${derivedState.estimatedCostChange > 0 ? 'text-red-600' : derivedState.estimatedCostChange < 0 ? 'text-green-600' : 'text-slate-800'}`}>
                    {derivedState.estimatedCostChange > 0 ? '+' : ''}{derivedState.estimatedCostChange.toFixed(2)}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">Aggregated change impact</div>
                </div>
              </div>

              {/* Data Table / Traceability */}
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800">Substitution Trace</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3">Original Ingredient</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Substituted With</th>
                        <th className="px-6 py-3 text-right">Cost Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.filter(r => r.status === 'changed').length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-400 bg-slate-50/50">
                            No active substitutions found.
                          </td>
                        </tr>
                      )}
                      {records.filter(r => r.status === 'changed').map((record) => (
                        <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                          <td className="px-6 py-4 font-medium text-slate-800">
                            {record.name}
                            <div className="text-xs text-slate-500 font-normal">{record.amount} {record.unit}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-amber-700 font-medium">{record.substitute}</div>
                            <div className="text-xs text-amber-600/80">{record.substituteAmount} {record.substituteUnit}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={record.projectedCostChange! > 0 ? 'text-red-600' : 'text-green-600'}>
                              {record.projectedCostChange! > 0 ? '+' : ''}{record.projectedCostChange?.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
