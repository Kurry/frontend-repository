import React, { useState } from 'react';
import { useStore, store, LessonBlock, ForecastState } from './store';
import { Activity, Clock, FileText, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';

export default function ForecastRibbon() {
  const session = useStore(state => state);
  const records = session.records;
  const derived = session.derived;

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeRecord = records.find(r => r.id === selectedId);

  const selectRecord = (id: string) => {
    if (selectedId === id) return;

    // Clear old selection state if any
    if (selectedId) {
        store.updateRecord(selectedId, { forecastRibbonState: 'idle' });
    }

    setSelectedId(id);
    store.updateRecord(id, { forecastRibbonState: 'selected' });
  };

  const mutateStatus = (newStatus: 'ready' | 'changed' | 'conflict') => {
    if (!activeRecord) return;

    // Check for conflict condition (e.g. marking empty as ready causes conflict)
    if (newStatus === 'ready' && activeRecord.status === 'empty') {
      store.updateRecord(activeRecord.id, { forecastRibbonState: 'conflict' });
      return;
    }

    store.updateRecord(activeRecord.id, {
      status: newStatus === 'conflict' ? activeRecord.status : newStatus,
      forecastRibbonState: newStatus === 'conflict' ? 'conflict' : 'resolved'
    });
  };

  const handleUndo = () => {
    store.undo();

    // Re-sync selected ID after undo if it doesn't match the state
    const currentRecords = store.getState().records;
    const currentSelected = currentRecords.find(r => r.forecastRibbonState !== 'idle');
    setSelectedId(currentSelected ? currentSelected.id : null);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-indigo-50/50">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Activity size={20} className="text-indigo-600"/> Forecast Ribbon
          </h2>
          <p className="text-sm text-slate-500 mt-1">Adjust a selected record and compare projected outcomes.</p>
        </div>
        <button
          onClick={handleUndo}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
          title="Undo last action (Ctrl+Z)"
        >
          <RotateCcw size={16} /> Undo
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* Left Side: Ribbon Selector */}
        <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto p-4 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Lesson Sequence</h3>

          <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
            {records.length === 0 ? (
               <div className="text-slate-400 text-sm italic text-center py-8">No records available.</div>
            ) : records.map((record, idx) => {
              const isSelected = selectedId === record.id;
              return (
                <div key={record.id} className="relative flex items-center justify-between md:justify-center">
                  <div className={`hidden md:block w-1/2 pr-8 text-right ${idx % 2 !== 0 ? 'invisible' : ''}`}>
                    {idx % 2 === 0 && (
                      <div
                        onClick={() => selectRecord(record.id)}
                        className={`inline-block text-left w-full p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md transform scale-105 z-10' : 'border-slate-200 bg-white hover:border-indigo-300 shadow-sm'}`}
                      >
                        <h4 className="font-semibold text-slate-800 text-sm mb-1">{record.title}</h4>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">{record.duration}m</span>
                          <span className="uppercase font-semibold text-slate-400">{record.status}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-white border-4 border-slate-300 transform -translate-x-1/2 z-10 shadow-sm" />

                  <div className={`w-full pl-12 md:pl-0 md:w-1/2 md:text-left md:pl-8 ${idx % 2 === 0 ? 'md:invisible' : ''}`}>
                    {(idx % 2 !== 0 || window.innerWidth < 768) && (
                      <div
                        onClick={() => selectRecord(record.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md transform scale-[1.02] md:scale-105 z-10' : 'border-slate-200 bg-white hover:border-indigo-300 shadow-sm'}`}
                      >
                         <h4 className="font-semibold text-slate-800 text-sm mb-1">{record.title}</h4>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">{record.duration}m</span>
                          <span className="uppercase font-semibold text-slate-400">{record.status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Inspector & Projection */}
        <div className="w-full md:w-1/2 flex flex-col bg-white">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-700">Derived Summary</h3>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1 text-slate-600"><Clock size={14}/> {derived.totalDuration}m total</span>
              <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={14}/> {derived.readyCount} ready</span>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {!activeRecord ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <FileText size={48} className="mb-4 opacity-20" />
                <p>Select a record on the ribbon to project outcomes.</p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-6">
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Active Selection</span>
                  <h2 className="text-2xl font-bold text-slate-800 mt-1">{activeRecord.title}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium uppercase border border-slate-200">State: {activeRecord.forecastRibbonState}</span>
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200">{activeRecord.duration} min</span>
                  </div>
                </div>

                {activeRecord.forecastRibbonState === 'conflict' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-800 animate-in shake">
                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                    <div>
                      <h4 className="font-semibold text-sm">Action Rejected</h4>
                      <p className="text-sm mt-1">Cannot mark an empty block as ready. Please add content or draft status first.</p>
                    </div>
                  </div>
                )}

                {activeRecord.forecastRibbonState === 'resolved' && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex gap-3 text-emerald-800 animate-in fade-in">
                    <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
                    <div>
                      <h4 className="font-semibold text-sm">Outcome Applied</h4>
                      <p className="text-sm mt-1">The lesson sequence summary has been updated.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4 border-t border-slate-200 pt-6">
                  <h4 className="text-sm font-medium text-slate-700">Projected Actions</h4>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => mutateStatus('ready')}
                      className="text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors group relative overflow-hidden"
                    >
                      <div className="font-semibold text-slate-800 group-hover:text-emerald-800">Force Ready</div>
                      <div className="text-xs text-slate-500 mt-1">Project this module as fully prepared.</div>
                    </button>

                    <button
                      onClick={() => mutateStatus('changed')}
                      className="text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="font-semibold text-slate-800 group-hover:text-blue-800">Mark Changed</div>
                      <div className="text-xs text-slate-500 mt-1">Flag this module for review in the sequence.</div>
                    </button>

                    <button
                      onClick={() => mutateStatus('conflict')}
                      className="text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-red-400 hover:bg-red-50 transition-colors group"
                    >
                      <div className="font-semibold text-slate-800 group-hover:text-red-800">Simulate Conflict</div>
                      <div className="text-xs text-slate-500 mt-1">Test rejection boundary rules.</div>
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
