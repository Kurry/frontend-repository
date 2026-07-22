import React, { useEffect, useState } from 'react';
import { useAppStore } from './store';
import { Activity, Plus, Undo2, Download, Upload, Trash2, AlertCircle, Filter } from 'lucide-react';
import type { IntakeStatus } from './types';

function App() {
  const store = useAppStore();
  const [filterStatus, setFilterStatus] = useState<IntakeStatus | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAmount, setNewAmount] = useState('250');
  const [newSource, setNewSource] = useState('Water');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Expose app state to WebMCP
    window.__appState = {
      exportData: store.exportData,
      importData: store.importData,
      clearData: store.clearData,
      getRecords: () => store.records,
      addRecord: store.addRecord,
      updateRecord: store.updateRecord,
    };
  }, [store]);

  const handleExport = () => {
    const data = store.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hydration-pattern-v1-forecast-ribbon.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (!store.importData(data)) {
            setErrorMsg('Invalid import schema format. No records updated.');
            setTimeout(() => setErrorMsg(null), 3000);
          }
        } catch (err) {
          setErrorMsg('Failed to parse JSON. No records updated.');
          setTimeout(() => setErrorMsg(null), 3000);
        }
      };
      reader.readAsText(file);
    }
    // reset input
    e.target.value = '';
  };

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const amount = parseInt(newAmount, 10);
      if (isNaN(amount) || amount <= 0 || amount > 5000) {
          setErrorMsg('Amount must be between 1 and 5000 ml.');
          return;
      }
      if (!newSource.trim()) {
          setErrorMsg('Source cannot be empty.');
          return;
      }
      store.addRecord({ timestamp: new Date().toISOString(), amountMl: amount, source: newSource });
      setShowAddForm(false);
      setNewAmount('250');
      setNewSource('Water');
      setErrorMsg(null);
  };

  const handleAdjustVolume = (change: number) => {
      if (!selectedRecord) return;
      const newVol = selectedRecord.amountMl + change;
      if (newVol < 0) {
          setErrorMsg('Adjustment cannot result in negative volume.');
          setTimeout(() => setErrorMsg(null), 3000);
          return;
      }
      if (newVol > 5000) {
          setErrorMsg('Adjustment cannot result in volume over 5000ml.');
          setTimeout(() => setErrorMsg(null), 3000);
          return;
      }
      store.adjustSelectedRecord(change);
  };

  const activeRecords = store.records.filter(r => r.status !== 'archived');
  const filteredRecords = activeRecords.filter(r => filterStatus === 'all' || r.status === filterStatus);
  const selectedRecord = store.records.find(r => r.id === store.selectedRecordId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 flex flex-col md:flex-row gap-6">

      {/* Primary Canvas */}
      <main className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <header className="p-4 border-b border-slate-200 flex flex-col gap-4 bg-slate-50/50">
          <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity className="text-blue-500" />
                <h1 className="font-semibold text-lg tracking-tight">Intake Events</h1>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => store.undo()}
                  className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  aria-label="Undo last action"
                >
                  <Undo2 size={16} /> <span className="hidden sm:inline">Undo</span>
                </button>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                >
                  <Plus size={16} /> <span className="hidden sm:inline">New Record</span>
                </button>
              </div>
          </div>

          <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Filter size={14} />
                  <span>Filter:</span>
                  <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                      <option value="all">All Active</option>
                      <option value="ready">Ready</option>
                      <option value="changed">Changed</option>
                      <option value="draft">Draft</option>
                  </select>
              </div>
          </div>
        </header>

        {showAddForm && (
            <div className="p-4 border-b border-slate-200 bg-blue-50/50">
                <form onSubmit={handleAddSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-slate-500 mb-1">Amount (ml)</label>
                        <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="w-full bg-white border border-slate-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-slate-500 mb-1">Source</label>
                        <input type="text" value={newSource} onChange={e => setNewSource(e.target.value)} className="w-full bg-white border border-slate-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                        <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 transition-colors flex-1 sm:flex-none">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex-1 sm:flex-none">Save</button>
                    </div>
                </form>
            </div>
        )}

        {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-sm border-b border-red-100 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
            </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          {filteredRecords.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 py-12">
              <Activity size={48} className="text-slate-300" />
              <p>{activeRecords.length === 0 ? 'No intake events tracked yet.' : 'No events match the selected filter.'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRecords.map(record => (
                <div
                  key={record.id}
                  onClick={() => store.selectRecord(record.id === store.selectedRecordId ? null : record.id)}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          store.selectRecord(record.id === store.selectedRecordId ? null : record.id);
                      }
                  }}
                  tabIndex={0}
                  className={`
                    group p-4 rounded-lg border cursor-pointer transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${record.forecastRibbonState === 'selected' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                    ${record.forecastRibbonState === 'changed' ? 'bg-amber-50 border-amber-200' : ''}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-medium">{record.amountMl} ml</span>
                      <span className="text-xs text-slate-500">{new Date(record.timestamp).toLocaleTimeString()} - {record.source}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${record.status === 'draft' ? 'bg-slate-100 text-slate-600' : record.status === 'changed' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {record.status}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); store.removeRecord(record.id); }}
                        className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                        aria-label="Archive record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Linked Views: Forecast Ribbon & Summary */}
      <aside className="w-full md:w-80 flex flex-col gap-6">

        {/* Forecast Ribbon Canvas */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-500">Forecast Ribbon</h2>

          {selectedRecord ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <p className="text-sm text-slate-600 mb-1">Adjusted Volume</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">{selectedRecord.amountMl} ml</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleAdjustVolume(-50)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded hover:bg-slate-50 active:bg-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none">-</button>
                    <button onClick={() => handleAdjustVolume(50)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded hover:bg-slate-50 active:bg-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none">+</button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                <AlertCircle size={14} />
                <span>Adjusting updates projection instantly.</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 py-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
              Select a record to adjust projection.
            </div>
          )}
        </section>

        {/* Derived Summary */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-500">Daily Projection</h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Current Total</span>
                <span className="font-medium">{store.derived.summary.totalMl} ml</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, (store.derived.summary.totalMl / store.derived.summary.dailyGoalMl) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Projected Outcome</span>
                <span className={`font-medium transition-colors duration-300 ${store.derived.summary.projectedMl > store.derived.summary.dailyGoalMl ? 'text-green-600' : 'text-slate-900'}`}>
                  {store.derived.summary.projectedMl} ml
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ease-out ${store.derived.summary.projectedMl > store.derived.summary.dailyGoalMl ? 'bg-green-500' : 'bg-slate-400'}`}
                  style={{ width: `${Math.min(100, (store.derived.summary.projectedMl / store.derived.summary.dailyGoalMl) * 100)}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center pt-2 border-t border-slate-100">
              Goal: {store.derived.summary.dailyGoalMl} ml
            </p>
          </div>
        </section>

        {/* Workspace Artifact Actions */}
        <section className="mt-auto flex flex-col gap-2">
          <button
            onClick={handleExport}
            className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
          >
            <Download size={16} /> Export Artifact
          </button>

          <label className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 transition-colors">
            <Upload size={16} /> Import Artifact
            <input type="file" accept=".json" onChange={handleImport} className="sr-only" />
          </label>
        </section>

      </aside>
    </div>
  );
}

export default App;
