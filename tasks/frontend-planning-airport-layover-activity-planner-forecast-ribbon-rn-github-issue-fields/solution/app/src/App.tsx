import React, { useState, useRef, useEffect } from 'react';
import type {
  AirportLayoverActivityPlannerSession,
  LayoverActivity,
  DerivedState,
  ForecastState,
  ActivityStatus
} from './types';
import { Undo, Download, Upload, Plus, Edit2, Trash2, X } from 'lucide-react';

const INITIAL_RECORDS: LayoverActivity[] = [
  { id: '1', title: 'Coffee at lounge', duration: 45, cost: 15, status: 'ready' },
  { id: '2', title: 'Buy souvenirs', duration: 30, cost: 50, status: 'empty' },
];

const calculateDerived = (records: LayoverActivity[]): DerivedState => {
  const activeRecords = records.filter(r => r.status !== 'archived');
  return {
    totalDuration: activeRecords.reduce((acc, r) => acc + r.duration, 0),
    totalCost: activeRecords.reduce((acc, r) => acc + r.cost, 0),
  };
};

export default function App() {
  const [session, setSession] = useState<AirportLayoverActivityPlannerSession>({
    schemaVersion: 'layover-plan-v1',
    exportedAt: new Date().toISOString(),
    records: INITIAL_RECORDS,
    derived: calculateDerived(INITIAL_RECORDS),
    history: [],
  });

  const [forecastState, setForecastState] = useState<ForecastState>({
    recordId: null,
    proposedDuration: 0,
    proposedCost: 0,
  });

  const [filterStatus, setFilterStatus] = useState<ActivityStatus | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Make session globally accessible for WebMCP
  useEffect(() => {
    (window as any).__APP_STATE__ = {
      session,
      setSession,
      calculateDerived
    };
  }, [session]);

  const commitState = (newRecords: LayoverActivity[]) => {
    setSession(prev => ({
      ...prev,
      records: newRecords,
      derived: calculateDerived(newRecords),
      history: [...prev.history, { records: prev.records, derived: prev.derived }]
    }));
  };

  const handleCreate = () => {
    const newRecord: LayoverActivity = {
      id: crypto.randomUUID(),
      title: 'New Activity',
      duration: 60,
      cost: 0,
      status: 'draft'
    };
    commitState([...session.records, newRecord]);
  };

  const handleDelete = (id: string) => {
    commitState(session.records.filter(r => r.id !== id));
  };

  const handleUndo = () => {
    if (session.history.length === 0) return;
    const previous = session.history[session.history.length - 1];
    setSession(prev => ({
      ...prev,
      records: previous.records,
      derived: previous.derived,
      history: prev.history.slice(0, -1)
    }));
    setForecastState({ recordId: null, proposedDuration: 0, proposedCost: 0 });
  };

  const selectForForecast = (record: LayoverActivity) => {
    setForecastState({
      recordId: record.id,
      proposedDuration: record.duration,
      proposedCost: record.cost
    });
  };

  const applyForecast = () => {
    if (!forecastState.recordId) return;
    const idx = session.records.findIndex(r => r.id === forecastState.recordId);
    if (idx === -1) return;

    const newRecords = [...session.records];
    newRecords[idx] = {
      ...newRecords[idx],
      duration: forecastState.proposedDuration,
      cost: forecastState.proposedCost,
      status: 'changed'
    };
    commitState(newRecords);
    setForecastState({ recordId: null, proposedDuration: 0, proposedCost: 0 });
  };

  const handleExport = () => {
    const exportData: AirportLayoverActivityPlannerSession = {
      ...session,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layover-plan-v1.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.schemaVersion !== 'layover-plan-v1' || !Array.isArray(data.records)) {
          throw new Error('Invalid schema');
        }
        // Basic validation passes, restore state
        setSession({
          schemaVersion: 'layover-plan-v1',
          exportedAt: data.exportedAt || new Date().toISOString(),
          records: data.records,
          derived: calculateDerived(data.records),
          history: data.history || []
        });
        setForecastState({ recordId: null, proposedDuration: 0, proposedCost: 0 });
      } catch (err) {
        console.error('Import failed', err);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const visibleRecords = session.records.filter(r => filterStatus === 'all' || r.status === filterStatus);

  // Projected derived state
  let projectedDerived = { ...session.derived };
  if (forecastState.recordId) {
    const originalRecord = session.records.find(r => r.id === forecastState.recordId);
    if (originalRecord && originalRecord.status !== 'archived') {
      projectedDerived.totalDuration = session.derived.totalDuration - originalRecord.duration + forecastState.proposedDuration;
      projectedDerived.totalCost = session.derived.totalCost - originalRecord.cost + forecastState.proposedCost;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Layover Activities</h1>
        <div className="flex gap-2">
          <button onClick={handleUndo} disabled={session.history.length === 0} className="px-3 py-1.5 flex items-center gap-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50">
            <Undo size={16} /> Undo
          </button>
          <button onClick={handleExport} className="px-3 py-1.5 flex items-center gap-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50">
            <Download size={16} /> Export
          </button>
          <label className="px-3 py-1.5 flex items-center gap-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
            <Upload size={16} /> Import
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
          </label>
        </div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Main Collection */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center bg-white p-4 rounded shadow-sm border border-slate-100">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as ActivityStatus | 'all')}
              className="border border-slate-200 rounded px-2 py-1 text-sm"
              aria-label="Filter status"
            >
              <option value="all">All Statuses</option>
              <option value="empty">Empty</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
            <button onClick={handleCreate} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1">
              <Plus size={16} /> Add Activity
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {visibleRecords.length === 0 && (
              <div className="p-8 text-center text-slate-400 bg-white rounded shadow-sm border border-slate-100">
                No activities found.
              </div>
            )}
            {visibleRecords.map(record => (
              <div
                key={record.id}
                className={`flex justify-between items-center bg-white p-4 rounded shadow-sm border ${forecastState.recordId === record.id ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-100'} transition-all duration-200`}
              >
                <div>
                  <h3 className="font-medium text-slate-800">{record.title}</h3>
                  <div className="text-sm text-slate-500 mt-1 flex gap-3">
                    <span>{record.duration} mins</span>
                    <span>${record.cost}</span>
                    <span className="capitalize px-1.5 py-0.5 bg-slate-100 rounded text-xs">{record.status}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectForForecast(record)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    aria-label={`Forecast ${record.title}`}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    aria-label={`Delete ${record.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar / Ribbon */}
        <div className="flex flex-col gap-6">
          {/* Summary Panel */}
          <div className="bg-white p-5 rounded shadow-sm border border-slate-100">
            <h2 className="text-lg font-medium text-slate-800 mb-4">Trip Summary</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Duration</span>
                <div className="flex items-center gap-2">
                  {forecastState.recordId && session.derived.totalDuration !== projectedDerived.totalDuration && (
                    <span className="text-sm text-slate-400 line-through">{session.derived.totalDuration}m</span>
                  )}
                  <span className={`font-medium ${forecastState.recordId && session.derived.totalDuration !== projectedDerived.totalDuration ? 'text-blue-600' : 'text-slate-800'}`}>
                    {projectedDerived.totalDuration}m
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Cost</span>
                <div className="flex items-center gap-2">
                  {forecastState.recordId && session.derived.totalCost !== projectedDerived.totalCost && (
                    <span className="text-sm text-slate-400 line-through">${session.derived.totalCost}</span>
                  )}
                  <span className={`font-medium ${forecastState.recordId && session.derived.totalCost !== projectedDerived.totalCost ? 'text-blue-600' : 'text-slate-800'}`}>
                    ${projectedDerived.totalCost}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast Ribbon */}
          {forecastState.recordId && (
            <div className="bg-white p-5 rounded shadow-sm border border-blue-200 ring-1 ring-blue-50 relative overflow-hidden transition-all duration-300">
              <button
                onClick={() => setForecastState({recordId: null, proposedCost: 0, proposedDuration: 0})}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
                aria-label="Close Forecast"
              >
                <X size={16} />
              </button>
              <h2 className="text-lg font-medium text-blue-900 mb-4 flex items-center gap-2">
                Forecast Ribbon
              </h2>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Adjust Duration (mins)</label>
                  <input
                    type="number"
                    value={forecastState.proposedDuration}
                    onChange={(e) => setForecastState(p => ({...p, proposedDuration: parseInt(e.target.value) || 0}))}
                    className={`w-full border rounded px-3 py-2 ${forecastState.proposedDuration < 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`}
                  />
                  {forecastState.proposedDuration < 0 && <p className="text-xs text-red-600 mt-1">Duration exceeds limit. Adjust duration.</p>}
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Adjust Cost ($)</label>
                  <input
                    type="number"
                    value={forecastState.proposedCost}
                    onChange={(e) => setForecastState(p => ({...p, proposedCost: parseInt(e.target.value) || 0}))}
                    className={`w-full border rounded px-3 py-2 ${forecastState.proposedCost < 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`}
                  />
                  {forecastState.proposedCost < 0 && <p className="text-xs text-red-600 mt-1">Cost cannot be negative.</p>}
                </div>
                <button
                  onClick={applyForecast}
                  disabled={forecastState.proposedDuration < 0 || forecastState.proposedCost < 0}
                  className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mt-2"
                >
                  Commit Forecast
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
