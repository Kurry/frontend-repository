import { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import type { StationStatus, WorkshopStation } from './types';
import { cn } from './utils';
import { Plus, Undo2, Download, Upload, AlertCircle, Search, Edit2, Archive, Activity } from 'lucide-react';
import { ForecastRibbon } from './ForecastRibbon';

export default function App() {
  const { state, dispatch } = useApp();
  const [filterStatus, setFilterStatus] = useState<StationStatus | 'all'>('all');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editForecast, setEditForecast] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<StationStatus>('draft');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredRecords = state.records.filter(
    (record) => filterStatus === 'all' || record.status === filterStatus
  );

  const selectedStation = state.records.find((r) => r.id === selectedStationId);

  // Global Undo Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (state.history.length > 1) {
          dispatch({ type: 'UNDO' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.history.length, dispatch]);

  const handleExport = () => {
    const data = { ...state, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workshop-toolboard-v1-forecast-ribbon.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.schemaVersion !== 'v1') throw new Error('Invalid schema version');
        if (!Array.isArray(json.records)) throw new Error('Invalid records format');
        if (json.records.some((r: any) => typeof r.forecastValue !== 'number' || r.forecastValue < 0 || r.forecastValue > 1000)) {
           throw new Error('Forecast values must be numbers between 0 and 1000');
        }
        dispatch({ type: 'IMPORT_SESSION', payload: { ...json, exportedAt: new Date().toISOString() } });
        setErrorMsg(null);
      } catch (err: any) {
        setErrorMsg('Import failed: ' + err.message + '. Please ensure valid JSON structure.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreate = () => {
    setIsEditing(true);
    setSelectedStationId(null);
    setEditTitle('New Station');
    setEditForecast(0);
    setEditStatus('draft');
    setErrorMsg(null);
  };

  const handleEdit = (station: WorkshopStation) => {
    setIsEditing(true);
    setSelectedStationId(station.id);
    setEditTitle(station.title);
    setEditForecast(station.forecastValue);
    setEditStatus(station.status);
    setErrorMsg(null);
  };

  const handleSave = () => {
    if (editForecast < 0 || editForecast > 1000) {
      setErrorMsg('Forecast value must be between 0 and 1000. Prior valid state preserved.');
      return;
    }
    if (editTitle.trim() === '') {
      setErrorMsg('Title is required. Prior valid state preserved.');
      return;
    }

    if (selectedStationId && isEditing) {
      dispatch({
        type: 'UPDATE_RECORD',
        payload: { id: selectedStationId, title: editTitle, forecastValue: editForecast, status: editStatus },
      });
    } else {
      dispatch({
        type: 'ADD_RECORD',
        payload: { title: editTitle, forecastValue: editForecast, status: editStatus },
      });
    }
    setIsEditing(false);
    setErrorMsg(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">

      {/* Left Sidebar: Summary & Controls */}
      <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 flex flex-col gap-6 overflow-y-auto">
        <div>
          <h1 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            Toolboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Community Workshop Planner</p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => dispatch({ type: 'UNDO' })} disabled={state.history.length <= 1} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 p-2 rounded text-sm transition-colors cursor-pointer" aria-label="Undo last mutation">
            <Undo2 className="w-4 h-4" /> Undo
          </button>
          <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 p-2 rounded text-sm transition-colors cursor-pointer" aria-label="Export session to JSON">
            <Download className="w-4 h-4" /> Export
          </button>
          <label className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 p-2 rounded text-sm cursor-pointer transition-colors" aria-label="Import session from JSON">
            <Upload className="w-4 h-4" /> Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow-sm">
          <h2 className="text-sm font-semibold mb-3 text-blue-800 dark:text-blue-300">Derived Summary</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 dark:text-slate-400">Total Count</p>
              <p className="font-bold text-lg">{state.derived.totalCount}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Total Forecast</p>
              <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{state.derived.totalForecast}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Draft / Ready</p>
              <p className="font-medium">{state.derived.draftCount} / {state.derived.readyCount}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Changed / Archived</p>
              <p className="font-medium">{state.derived.changedCount} / {state.derived.archivedCount}</p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm flex items-start gap-2 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

      </aside>

      {/* Main Content: Stations List */}
      <main className="flex-1 flex flex-col p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900">

        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold">Workshop Stations</h2>

          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as StationStatus | 'all')}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Station
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRecords.map((station) => (
            <div
              key={station.id}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedStationId(station.id);
              }}
              className={cn(
                "p-5 rounded-xl border bg-white dark:bg-slate-800 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col transform",
                selectedStationId === station.id && "ring-2 ring-blue-500 border-transparent shadow-md scale-[1.02]",
                station.status === 'archived' ? "opacity-60 grayscale hover:grayscale-0" : "border-slate-200 dark:border-slate-700"
              )}
              onClick={() => setSelectedStationId(station.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg leading-tight">{station.title}</h3>
                <span className={cn(
                  "px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider",
                  station.status === 'draft' && "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
                  station.status === 'ready' && "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400",
                  station.status === 'changed' && "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400",
                  station.status === 'archived' && "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                )}>
                  {station.status}
                </span>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-1">
                Forecast: <span className="font-semibold text-slate-900 dark:text-slate-100 text-base ml-1">{station.forecastValue}</span>
              </div>

              <div className="flex justify-end gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(station); }}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                  aria-label={`Edit ${station.title}`}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {station.status !== 'archived' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: 'ARCHIVE_RECORD', payload: station.id });
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                    aria-label={`Archive ${station.title}`}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredRecords.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
              <p className="text-lg">No stations found.</p>
              <p className="text-sm mt-1">Adjust filters or create a new station.</p>
            </div>
          )}
        </div>
      </main>

      {/* Right Drawer/Panel: Inspector / Editor */}
      {(isEditing || selectedStation) && (
        <aside className={cn(
          "w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 flex flex-col fixed inset-x-0 bottom-0 md:inset-y-0 md:right-0 transform transition-transform duration-300 ease-in-out z-50 h-[60vh] md:h-auto overflow-y-auto md:relative md:translate-y-0",
          (isEditing || selectedStation) ? "translate-y-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none" : "translate-y-full md:translate-x-full"
        )}>
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">{isEditing ? (selectedStationId ? 'Edit Station' : 'New Station') : 'Inspector'}</h2>
              <button
                onClick={() => { setIsEditing(false); setSelectedStationId(null); }}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                aria-label="Close inspector panel"
              >
                ✕
              </button>
           </div>

           {isEditing ? (
             <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    placeholder="E.g., Design Workshop"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as StationStatus)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  >
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="changed">Changed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Forecast Value (0-1000)</label>
                  <input
                    type="number"
                    value={editForecast}
                    onChange={(e) => setEditForecast(parseInt(e.target.value) || 0)}
                    min="0"
                    max="1000"
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  />
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2.5 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer"
                  >
                    Save
                  </button>
                </div>
             </div>
           ) : (
             <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
               {selectedStation && (
                 <div>
                   <div className="mb-6">
                     <h3 className="text-2xl font-bold mb-3">{selectedStation.title}</h3>
                     <div className="flex items-center gap-3 text-sm">
                       <span className={cn(
                         "px-3 py-1 font-bold rounded-full uppercase tracking-wider",
                         selectedStation.status === 'draft' && "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
                         selectedStation.status === 'ready' && "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400",
                         selectedStation.status === 'changed' && "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400",
                         selectedStation.status === 'archived' && "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                       )}>
                         {selectedStation.status}
                       </span>
                     </div>
                   </div>

                   <ForecastRibbon station={selectedStation} />

                   <div className="mt-8 flex gap-2">
                     <button
                        onClick={() => handleEdit(selectedStation)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                     >
                       <Edit2 className="w-4 h-4" /> Edit Details
                     </button>
                   </div>
                 </div>
               )}
             </div>
           )}

        </aside>
      )}

    </div>
  );
}
