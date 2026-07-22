import React, { useState, useEffect } from 'react';
import { useStore, ACTIONS, STATES } from './store';
import { Undo2, Check, X, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function ForecastRibbon() {
  const { state, dispatch, derived } = useStore();
  const selectedRecord = state.records.find(r => r.id === state.selectedRecordId);
  const [localProjection, setLocalProjection] = useState(null);

  // Reset local projection when selection changes
  useEffect(() => {
    if (selectedRecord) {
      setLocalProjection({ state: selectedRecord.state, duration: selectedRecord.duration });
    } else {
      setLocalProjection(null);
    }
  }, [state.selectedRecordId]);

  const handleProjectionChange = (field, value) => {
    const newProj = { ...localProjection, [field]: value };
    setLocalProjection(newProj);
    dispatch({ type: ACTIONS.SET_FORECAST_PROJECTION, payload: newProj });
  };

  const applyProjection = () => {
    // Conflict/boundary logic: A conflicting or incomplete mutation is rejected without partial updates.
    if (!localProjection || localProjection.duration < 0) {
      alert("Invalid duration. Projection rejected."); // Simple feedback for demo
      return;
    }
    dispatch({ type: ACTIONS.APPLY_PROJECTION });
  };

  const cancelProjection = () => {
    setLocalProjection(selectedRecord ? { state: selectedRecord.state, duration: selectedRecord.duration } : null);
    dispatch({ type: ACTIONS.SET_FORECAST_PROJECTION, payload: null });
  };

  const handleUndo = () => {
    dispatch({ type: ACTIONS.UNDO });
  };

  const hasChanges = selectedRecord && localProjection &&
    (selectedRecord.state !== localProjection.state || selectedRecord.duration !== localProjection.duration);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Toolbar / Ribbon */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-4">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold tracking-wide">Forecast Ribbon</h2>

          {selectedRecord && (
             <div className="flex items-center gap-3 ml-6 pl-6 border-l border-slate-700">
               <span className="text-sm font-medium text-slate-300">Editing:</span>
               <span className="text-sm bg-slate-800 px-3 py-1 rounded border border-slate-700">{selectedRecord.name}</span>
             </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleUndo}
            disabled={state.undoStack.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Undo last action"
          >
            <Undo2 className="w-4 h-4" />
            Undo
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
        {!selectedRecord ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <TrendingUp className="w-16 h-16 opacity-20" />
            <p className="text-lg font-medium">Select a sound layer to forecast changes</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Projection Controls */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold tracking-wider text-slate-500 uppercase mb-6">Adjust Projection</h3>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Target State</label>
                    <div className="flex flex-wrap gap-2">
                      {STATES.map(s => (
                        <button
                          key={s}
                          onClick={() => handleProjectionChange('state', s)}
                          className={cn(
                            "px-4 py-2 text-sm rounded-md font-medium capitalize transition-all motion-reduce:transition-none",
                            localProjection?.state === s
                              ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600 ring-offset-2"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Target Duration (s)</label>
                    <input
                      type="range"
                      min="0"
                      max="600"
                      step="1"
                      value={localProjection?.duration || 0}
                      onChange={(e) => handleProjectionChange('duration', parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-600"
                    />
                    <div className="mt-2 font-mono text-lg text-slate-800">{localProjection?.duration}s</div>
                  </div>
                </div>

                {/* Compare View */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-center">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-4 text-center">Projected Outcome</h4>

                  <div className="flex items-center justify-between px-4 mb-4">
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-1">Current</div>
                      <div className="font-mono text-sm bg-white px-2 py-1 rounded border shadow-sm">
                        {selectedRecord.state} <br/> {selectedRecord.duration}s
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center px-4">
                      <div className={cn("h-0.5 w-full", hasChanges ? "bg-indigo-400" : "bg-slate-200")}></div>
                      <div className={cn("w-2 h-2 rounded-full -ml-1", hasChanges ? "bg-indigo-500" : "bg-slate-300")}></div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs font-medium text-indigo-600 mb-1">Projected</div>
                      <div className={cn("font-mono text-sm px-2 py-1 rounded border shadow-sm transition-all motion-reduce:transition-none", hasChanges ? "bg-indigo-50 border-indigo-200 text-indigo-900 scale-105 motion-reduce:scale-100" : "bg-white border-slate-200 text-slate-500")}>
                        {localProjection?.state} <br/> {localProjection?.duration}s
                      </div>
                    </div>
                  </div>

                  {hasChanges && (
                    <div className="flex justify-center gap-3 mt-4">
                      <button onClick={cancelProjection} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors" aria-label="Cancel Projection">
                        <X className="w-5 h-5" />
                      </button>
                      <button onClick={applyProjection} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full shadow-md transition-transform active:scale-95 motion-reduce:active:scale-100" aria-label="Apply Projection">
                        <Check className="w-4 h-4" />
                        Apply Mutation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Derived Summary View */}
            <div className="grid grid-cols-3 gap-6">
               <div className={cn("bg-white p-6 rounded-xl border shadow-sm transition-all duration-300", derived.projectionActive ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200")}>
                 <div className="text-sm font-medium text-slate-500 mb-1">Total Duration</div>
                 <div className={cn("text-3xl font-light font-mono", derived.projectionActive ? "text-indigo-600" : "text-slate-900")}>
                   {derived.totalDuration}s
                 </div>
               </div>

               <div className={cn("bg-white p-6 rounded-xl border shadow-sm transition-all duration-300", derived.projectionActive ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200")}>
                 <div className="text-sm font-medium text-slate-500 mb-1">Active Layers</div>
                 <div className={cn("text-3xl font-light font-mono", derived.projectionActive ? "text-indigo-600" : "text-slate-900")}>
                   {derived.activeCount}
                 </div>
               </div>

               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <div className="text-sm font-medium text-slate-500 mb-1">Total Records</div>
                 <div className="text-3xl font-light font-mono text-slate-900">
                   {derived.totalRecords}
                 </div>
               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
