import React, { useReducer, useEffect, useState } from 'react';
import { reducer } from './store/reducer';
import { initialReducerState } from './store/fixture';
import { PriorityMatrix } from './components/PriorityMatrix';
import { TimeCanvas } from './components/TimeCanvas';
import { FocusView } from './components/FocusView';
import { checkConflicts, generateICS } from './lib/utils';
import { motion } from 'framer-motion';

// Exported Context for WebMCP
export const AppContext = React.createContext(null);

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialReducerState);
  const [draggedTask, setDraggedTask] = useState(null);
  const [showRollover, setShowRollover] = useState(false);
  const [exportData, setExportData] = useState(null);

  const conflicts = checkConflicts(state.blocks, state.tasks, state.appointments, state.breaks);

  // Sync state to window for WebMCP integration
  useEffect(() => {
    window.__APP_STATE__ = state;
    window.__APP_DISPATCH__ = dispatch;
  }, [state]);

  const handleExport = () => {
    const json = JSON.stringify(state, null, 2);
    const ics = generateICS(state.blocks, state.tasks, state.appointments, state.breaks);
    setExportData({ json, ics });
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedState = JSON.parse(event.target.result);
          // Simple validation
          if (importedState.tasks && importedState.blocks) {
             dispatch({ type: 'IMPORT_STATE', state: importedState });
          } else {
             alert('Invalid JSON');
          }
        } catch (e) {
          alert('Malformed JSON');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <div className="flex flex-col h-screen bg-gray-100 overflow-hidden text-gray-900 font-sans">

        {/* Top Chrome */}
        {state.viewMode === 'planning' && (
          <header className="flex items-center justify-between p-4 bg-white border-b shadow-sm shrink-0">
            <h1 className="text-xl font-bold">Cognitive Load Day Sculptor</h1>

            <div className="flex items-center gap-4 text-sm">
              <button
                onClick={() => dispatch({ type: 'UNDO' })}
                disabled={state.historyIndex <= 0}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Undo
              </button>
              <button
                onClick={() => dispatch({ type: 'REDO' })}
                disabled={state.historyIndex >= state.history.length - 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Redo
              </button>

              <div className="h-6 w-px bg-gray-300 mx-2" />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.propagationMode}
                  onChange={(e) => dispatch({ type: 'SET_PROPAGATION_MODE', mode: e.target.checked })}
                />
                Propagate
              </label>

              <div className="h-6 w-px bg-gray-300 mx-2" />

              <button
                onClick={() => setShowRollover(true)}
                className="px-3 py-1 border rounded bg-yellow-50 text-yellow-800 border-yellow-200"
              >
                Rollover ({state.rolloverTasks.length})
              </button>

              <button
                onClick={() => dispatch({ type: 'CREATE_CHECKPOINT' })}
                className="px-3 py-1 border rounded bg-blue-50 text-blue-800"
              >
                Checkpoint
              </button>

              <button onClick={handleExport} className="px-3 py-1 border rounded bg-gray-800 text-white">Export</button>

              <label className="px-3 py-1 border rounded bg-white cursor-pointer">
                Import
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 p-4">
          {state.viewMode === 'planning' && (
            <>
              {/* Left Column: Priority Matrix */}
              <div className="w-full md:w-1/2 flex flex-col gap-4">
                <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
                  <div className="p-3 border-b bg-gray-50 flex justify-between items-center shrink-0">
                    <h2 className="font-semibold text-sm">Backlog</h2>
                    <span className="text-xs bg-gray-200 px-2 rounded-full">{state.tasks.filter(t => !state.blocks.some(b => b.taskId === t.id)).length} pending</span>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <PriorityMatrix
                      tasks={state.tasks}
                      blocks={state.blocks}
                      onTaskMove={(id, u, i) => dispatch({ type: 'UPDATE_TASK_PRIORITY', taskId: id, urgency: u, importance: i })}
                      onDragStart={(t) => setDraggedTask(t)}
                    />
                  </div>
                </div>

                {/* Conflicts / Analytics */}
                {conflicts.length > 0 && (
                  <div className="shrink-0 p-3 bg-red-50 border border-red-200 rounded-xl max-h-48 overflow-y-auto">
                    <h3 className="text-sm font-bold text-red-800 mb-2">Conflicts ({conflicts.length})</h3>
                    <ul className="text-xs text-red-700 space-y-1 pl-4 list-disc">
                      {conflicts.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Column: Timeline Canvas */}
              <TimeCanvas
                blocks={state.blocks}
                tasks={state.tasks}
                appointments={state.appointments}
                breaks={state.breaks}
                capacityCurve={state.baseCapacityCurve}
                draggedTask={draggedTask}
                onBlockPlace={(b) => dispatch({ type: 'PLACE_BLOCK', block: b })}
                onBlockUpdate={(id, up, prop) => dispatch({ type: 'UPDATE_BLOCK', blockId: id, updates: up, propagate: prop })}
              />
            </>
          )}

          {state.viewMode === 'focus' && (
            <FocusView
              focusState={state.focusState}
              blocks={state.blocks}
              tasks={state.tasks}
              onTick={(m) => dispatch({ type: 'TICK_TIMER', minutes: m })}
              onToggleTimer={() => dispatch({ type: 'TOGGLE_TIMER' })}
              onLogInterruption={(id, cat, lost, rec) => dispatch({ type: 'LOG_INTERRUPTION', blockId: id, category: cat, lostMinutes: lost, recovery: rec })}
              onExit={() => dispatch({ type: 'SET_VIEW_MODE', mode: 'planning' })}
            />
          )}
        </div>

        {/* Global Focus Trigger (Debug/WebMCP uses actions, but UI needs one if not dragged) */}
        {state.viewMode === 'planning' && state.blocks.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <button
              onClick={() => {
                dispatch({ type: 'SET_FOCUS_BLOCK', blockId: state.blocks[0].id });
                dispatch({ type: 'SET_VIEW_MODE', mode: 'focus' });
              }}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-blue-700"
            >
              Start Focus (First Block)
            </button>
          </div>
        )}

        {/* Rollover Drawer */}
        {showRollover && (
          <div className="absolute inset-0 bg-black/40 z-50 flex items-end">
             <div className="bg-white w-full h-1/2 rounded-t-2xl shadow-xl flex flex-col">
                <div className="p-4 border-b flex justify-between">
                  <h2 className="text-xl font-bold">Morning Rollover</h2>
                  <button onClick={() => setShowRollover(false)}>Close</button>
                </div>
                <div className="p-4 flex-1 overflow-y-auto">
                  {state.rolloverTasks.length === 0 ? <p>No rollover tasks.</p> : (
                    <div className="space-y-2">
                      {state.rolloverTasks.map(rt => (
                        <div key={rt.id} className="p-3 border rounded flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{rt.title}</p>
                            <p className="text-xs text-gray-500">Dur: {rt.duration*15}m | Load: {rt.load}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => dispatch({ type: 'ROLLOVER_ACTION', taskId: rt.id, decision: 'drop'})} className="text-red-600 px-3 py-1 bg-red-50 rounded">Drop</button>
                            <button onClick={() => dispatch({ type: 'ROLLOVER_ACTION', taskId: rt.id, decision: 'defer'})} className="text-gray-600 px-3 py-1 bg-gray-100 rounded">Defer</button>
                            <button onClick={() => dispatch({ type: 'ROLLOVER_ACTION', taskId: rt.id, decision: 'escalate'})} className="text-blue-600 px-3 py-1 bg-blue-50 rounded font-semibold">Escalate</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
             </div>
          </div>
        )}

        {/* Export Modal */}
        {exportData && (
          <div className="absolute inset-0 bg-black/60 z-50 flex justify-center items-center p-8">
            <div className="bg-white w-full max-w-4xl h-full max-h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
              <div className="flex justify-between border-b p-4">
                <h3 className="font-bold">Export Checkpoint</h3>
                <button onClick={() => setExportData(null)}>Close</button>
              </div>
              <div className="flex-1 flex overflow-hidden">
                <div className="w-1/2 border-r flex flex-col">
                  <div className="p-2 bg-gray-50 border-b font-mono text-sm font-bold text-center">Session JSON</div>
                  <textarea readOnly className="flex-1 p-4 font-mono text-xs outline-none resize-none" value={exportData.json} />
                </div>
                <div className="w-1/2 flex flex-col">
                  <div className="p-2 bg-gray-50 border-b font-mono text-sm font-bold text-center">ICS Format</div>
                  <textarea readOnly className="flex-1 p-4 font-mono text-xs outline-none resize-none" value={exportData.ics} />
                </div>
              </div>
              <div className="p-4 border-t flex justify-end gap-2 bg-gray-50 shrink-0">
                <button
                  onClick={() => { navigator.clipboard.writeText(exportData.json); alert('JSON Copied'); }}
                  className="px-4 py-2 bg-white border shadow-sm rounded text-sm font-medium"
                >
                  Copy JSON
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(exportData.ics); alert('ICS Copied'); }}
                  className="px-4 py-2 bg-blue-600 text-white shadow-sm rounded text-sm font-medium"
                >
                  Copy ICS
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppContext.Provider>
  );
}
