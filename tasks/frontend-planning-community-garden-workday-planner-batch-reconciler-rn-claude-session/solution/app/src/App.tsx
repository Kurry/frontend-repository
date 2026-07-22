import React, { useState, useEffect, useRef } from 'react';
import { Leaf, Plus, Trash2, Edit2, RotateCcw, Download, Upload, CheckCircle2, Circle, AlertCircle, X } from 'lucide-react';

// --- Types ---
export type TaskStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived' | 'reconciled';

export interface WorkTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  estimatedHours: number;
  assignedArea: string;
  batchId?: string;
}

export interface BatchSummary {
  batchId: string;
  taskIds: string[];
  totalHours: number;
  areasInvolved: string[];
  createdAt: string;
}

export interface SessionState {
  schemaVersion: "v1";
  exportedAt?: string;
  records: WorkTask[];
  derived: {
    batches: BatchSummary[];
    activeSelection: string[];
  };
  history: Array<{
    action: string;
    timestamp: string;
    previousState: Omit<SessionState, 'history' | 'exportedAt'>;
  }>;
}

const initialState: SessionState = {
  schemaVersion: "v1",
  records: [
    { id: '1', title: 'Weed tomato beds', description: 'Clear all weeds from beds 1-4', status: 'draft', estimatedHours: 2, assignedArea: 'North Garden' },
    { id: '2', title: 'Repair fence', description: 'Fix the broken mesh near the gate', status: 'ready', estimatedHours: 3, assignedArea: 'Perimeter' },
    { id: '3', title: 'Harvest zucchini', description: 'Harvest all mature zucchini before they get too big', status: 'empty', estimatedHours: 1, assignedArea: 'South Garden' },
  ],
  derived: {
    batches: [],
    activeSelection: []
  },
  history: []
};

// ... App implementation ...
export default function App() {
  const [state, setState] = useState<SessionState>(initialState);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkTask | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State mutations with history
  const pushHistory = (newState: Partial<SessionState>, actionName: string) => {
    setState(prev => {
      const stateToSave = {
        schemaVersion: prev.schemaVersion,
        records: JSON.parse(JSON.stringify(prev.records)),
        derived: JSON.parse(JSON.stringify(prev.derived))
      };

      return {
        ...prev,
        ...newState,
        history: [
          ...prev.history,
          {
            action: actionName,
            timestamp: new Date().toISOString(),
            previousState: stateToSave
          }
        ]
      };
    });
  };

  useEffect(() => {
    // Setup WebMCP
    const setupWebMCP = () => {
      (window as any).webmcp_session_info = () => ({
        id: "eval-intelligence/frontend-planning-community-garden-workday-planner-batch-reconciler-rn-claude-session",
        name: "eval-intelligence/frontend-planning-community-garden-workday-planner-batch-reconciler-rn-claude-session"
      });

      (window as any).webmcp_list_tools = () => {
        return [
          { name: "entity_create_record" },
          { name: "entity_update_record" },
          { name: "entity_delete_record" },
          { name: "entity_list_records" },
          { name: "workflow_group_records" },
          { name: "workflow_reconcile_batch" },
          { name: "workflow_undo_last_action" },
          { name: "artifact_export_session_json" },
          { name: "artifact_import_session_json" }
        ];
      };

      (window as any).webmcp_invoke_tool = (toolName: string, args: any) => {
        let result: any = { success: false };
        setState(current => {
          let next = { ...current };
          const saveHistory = (s: SessionState) => {
             const stateToSave = {
              schemaVersion: s.schemaVersion,
              records: JSON.parse(JSON.stringify(s.records)),
              derived: JSON.parse(JSON.stringify(s.derived))
            };
            next.history = [...s.history, {
              action: toolName,
              timestamp: new Date().toISOString(),
              previousState: stateToSave
            }];
          };

          if (toolName === "entity_list_records") {
            result = { success: true, records: next.records };
          } else if (toolName === "entity_create_record") {
            saveHistory(current);
            const newRecord = { ...args.payload, id: args.payload.id || Date.now().toString() };
            next.records = [...next.records, newRecord];
            result = { success: true, record: newRecord };
          } else if (toolName === "entity_update_record") {
            saveHistory(current);
            next.records = next.records.map(r => r.id === args.id ? { ...r, ...args.payload } : r);
            result = { success: true };
          } else if (toolName === "entity_delete_record") {
             saveHistory(current);
             next.records = next.records.filter(r => r.id !== args.id);
             next.derived.activeSelection = next.derived.activeSelection.filter(id => id !== args.id);
             result = { success: true };
          } else if (toolName === "workflow_group_records") {
             saveHistory(current);
             next.derived.activeSelection = args.ids || [];
             result = { success: true };
          } else if (toolName === "workflow_reconcile_batch") {
             if (next.derived.activeSelection.length > 0) {
                saveHistory(current);
                const batchId = 'batch-' + Date.now();
                const selectedTasks = next.records.filter(r => next.derived.activeSelection.includes(r.id));
                const totalHours = selectedTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
                const areasInvolved = Array.from(new Set(selectedTasks.map(t => t.assignedArea)));

                const batchSum: BatchSummary = {
                  batchId,
                  taskIds: next.derived.activeSelection,
                  totalHours,
                  areasInvolved,
                  createdAt: new Date().toISOString()
                };

                next.derived.batches = [...next.derived.batches, batchSum];
                next.records = next.records.map(r =>
                  next.derived.activeSelection.includes(r.id) ? { ...r, status: 'reconciled', batchId } : r
                );
                next.derived.activeSelection = [];
                result = { success: true, batchId };
             } else {
                result = { success: false, error: "No records selected" };
             }
          } else if (toolName === "workflow_undo_last_action") {
             if (current.history.length > 0) {
                const last = current.history[current.history.length - 1];
                next = {
                  ...current,
                  ...last.previousState,
                  history: current.history.slice(0, -1)
                };
                result = { success: true };
             } else {
                result = { success: false, error: "No history to undo" };
             }
          } else if (toolName === "artifact_export_session_json") {
             result = { success: true, artifact: { ...next, exportedAt: new Date().toISOString() } };
          } else if (toolName === "artifact_import_session_json") {
             if (args.payload && args.payload.schemaVersion === 'v1' && Array.isArray(args.payload.records)) {
                next = {
                  ...args.payload,
                  history: args.payload.history || []
                };
                result = { success: true };
             } else {
                result = { success: false, error: "Invalid artifact format" };
             }
          }
          return next;
        });
        return result;
      };
    };
    setupWebMCP();
  }, []);

  const handleToggleSelect = (id: string) => {
    setState(prev => {
      const activeSelection = prev.derived.activeSelection.includes(id)
        ? prev.derived.activeSelection.filter(x => x !== id)
        : [...prev.derived.activeSelection, id];
      return {
        ...prev,
        derived: { ...prev.derived, activeSelection }
      };
    });
  };

  const handleSaveTask = (task: WorkTask) => {
    if (isCreating) {
      pushHistory({ records: [...state.records, { ...task, id: Date.now().toString() }] }, 'Create Task');
      setIsCreating(false);
    } else {
      pushHistory({ records: state.records.map(t => t.id === task.id ? task : t) }, 'Update Task');
      setEditingTask(null);
    }
  };

  const handleDeleteTask = (id: string) => {
    pushHistory({
      records: state.records.filter(t => t.id !== id),
      derived: {
        ...state.derived,
        activeSelection: state.derived.activeSelection.filter(x => x !== id)
      }
    }, 'Delete Task');
  };

  const handleReconcile = () => {
    if (state.derived.activeSelection.length === 0) return;
    const batchId = 'batch-' + Date.now();
    const selectedTasks = state.records.filter(r => state.derived.activeSelection.includes(r.id));

    // Conflict check (e.g. some already reconciled)
    if (selectedTasks.some(t => t.status === 'reconciled')) {
      alert("Conflict: Cannot reconcile tasks that are already reconciled.");
      return;
    }

    const totalHours = selectedTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
    const areasInvolved = Array.from(new Set(selectedTasks.map(t => t.assignedArea)));

    const batchSum: BatchSummary = {
      batchId,
      taskIds: state.derived.activeSelection,
      totalHours,
      areasInvolved,
      createdAt: new Date().toISOString()
    };

    pushHistory({
      records: state.records.map(r =>
        state.derived.activeSelection.includes(r.id) ? { ...r, status: 'reconciled', batchId } : r
      ),
      derived: {
        ...state.derived,
        batches: [...state.derived.batches, batchSum],
        activeSelection: []
      }
    }, 'Reconcile Batch');
  };

  const handleUndo = () => {
    if (state.history.length === 0) return;
    const last = state.history[state.history.length - 1];
    setState(prev => ({
      ...prev,
      ...last.previousState,
      history: prev.history.slice(0, -1)
    }));
  };

  const handleExport = () => {
    const artifact = {
      ...state,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'garden-workday-v1-batch-reconciler.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = JSON.parse(event.target?.result as string);
        if (payload && payload.schemaVersion === 'v1' && Array.isArray(payload.records)) {
          setState({
            schemaVersion: payload.schemaVersion,
            records: payload.records,
            derived: payload.derived || { batches: [], activeSelection: [] },
            history: payload.history || []
          });
        } else {
          console.error("Invalid artifact format");
        }
      } catch (err) {
        console.error("Malformed import");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  const handleClear = () => {
     setState({
       schemaVersion: "v1",
       records: [],
       derived: { batches: [], activeSelection: [] },
       history: []
     });
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      <header className="bg-emerald-800 text-white p-4 shadow-md flex items-center justify-between z-10 relative">
        <div className="flex items-center space-x-2">
          <Leaf className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">Community Garden Workday Planner</h1>
          <h1 className="text-xl font-bold tracking-tight sm:hidden">Garden Planner</h1>
        </div>
        <div className="flex items-center space-x-2 text-emerald-100 text-sm">
          <button onClick={handleUndo} disabled={state.history.length === 0} className="p-2 hover:bg-emerald-700 rounded disabled:opacity-50" title="Undo">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={handleExport} className="p-2 hover:bg-emerald-700 rounded flex items-center" title="Export">
            <Download className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-emerald-700 rounded flex items-center" title="Import">
            <Upload className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button onClick={handleClear} className="p-2 hover:bg-emerald-700 rounded flex items-center" title="Clear">
            <Trash2 className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Clear</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Main tasks list */}
        <div className="flex-1 overflow-y-auto p-4 border-r border-neutral-200" aria-label="Work Tasks Collection">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-semibold text-neutral-800 flex items-center">
               <Circle className="w-5 h-5 mr-2 text-emerald-600" />
               Work Tasks ({state.records.length})
             </h2>
             <div className="flex space-x-2">
                 <button className="flex items-center px-3 py-1.5 bg-emerald-600 text-white rounded shadow-sm hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500" onClick={() => setIsCreating(true)}>
                    <Plus className="w-4 h-4 mr-1" /> New Task
                 </button>
                 <button className="md:hidden p-1.5 bg-emerald-100 text-emerald-800 rounded-md" onClick={() => setIsDrawerOpen(!isDrawerOpen)}>
                    <CheckCircle2 className="w-5 h-5" />
                 </button>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
              {state.records.map(task => {
                const isSelected = state.derived.activeSelection.includes(task.id);
                return (
                  <div key={task.id}
                    className={`p-4 rounded-lg shadow-sm border transition-all duration-200 cursor-pointer flex flex-col h-full
                      ${isSelected ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-neutral-200 hover:border-emerald-300'}
                      ${task.status === 'reconciled' ? 'opacity-70 bg-neutral-100' : ''}
                    `}
                    onClick={() => handleToggleSelect(task.id)}
                    role="listitem"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleSelect(task.id);
                      }
                    }}
                    aria-selected={isSelected}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-neutral-900 line-clamp-1 flex-1 pr-2">{task.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap
                        ${task.status === 'reconciled' ? 'bg-purple-100 text-purple-700' :
                          task.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                          task.status === 'empty' ? 'bg-gray-100 text-gray-700' :
                          'bg-emerald-100 text-emerald-700'}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mb-3 flex-1 line-clamp-2">{task.description}</p>
                    <div className="flex text-xs text-neutral-500 justify-between items-center mt-auto border-t pt-2">
                      <span>{task.estimatedHours} hrs • {task.assignedArea}</span>
                      <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setEditingTask(task)} className="p-1 text-neutral-400 hover:text-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded" aria-label="Edit task">
                           <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-neutral-400 hover:text-red-600 focus:ring-1 focus:ring-red-500 rounded" aria-label="Delete task">
                           <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Batch reconciler summary (Desktop Panel / Mobile Drawer) */}
        <div className={`
          absolute md:relative top-0 right-0 h-full w-full md:w-96 bg-white
          border-l border-neutral-200 shadow-xl md:shadow-sm z-20 md:z-0
          transition-transform duration-300 ease-in-out flex flex-col
          ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
        aria-label="Batch Reconciler Panel"
        >
          <div className="p-4 bg-emerald-50 border-b border-emerald-100 sticky top-0 flex justify-between items-center">
             <h2 className="text-lg font-semibold text-emerald-900 flex items-center">
               <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-700" />
               Batch Reconciler
             </h2>
             <button className="md:hidden p-2 text-emerald-800 rounded-md focus:ring-2 focus:ring-emerald-500" onClick={() => setIsDrawerOpen(false)} aria-label="Close drawer">
                <X className="w-5 h-5" />
             </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {state.derived.activeSelection.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-emerald-100/50 p-4 rounded-lg border border-emerald-200">
                  <h3 className="font-medium text-emerald-900 mb-2">Pending Batch</h3>
                  <div className="text-sm text-emerald-800 space-y-1 mb-4">
                    <p>Records selected: <strong>{state.derived.activeSelection.length}</strong></p>
                    <p>Total estimated hours: <strong>
                      {state.records.filter(r => state.derived.activeSelection.includes(r.id)).reduce((sum, t) => sum + Number(t.estimatedHours || 0), 0)}
                    </strong></p>
                  </div>
                  <button
                    onClick={handleReconcile}
                    className="w-full py-2 bg-emerald-600 text-white rounded shadow-sm hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                  >
                    Reconcile Aggregate Totals
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 text-center text-neutral-500">
                 <AlertCircle className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                 <p>Select tasks to group into a batch and reconcile.</p>
              </div>
            )}

            {state.derived.batches.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">Reconciled Batches</h3>
                <div className="space-y-3">
                  {state.derived.batches.map(b => (
                    <div key={b.batchId} className="p-3 border border-neutral-200 rounded-md bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-xs text-neutral-500">{b.batchId}</span>
                        <span className="text-xs text-neutral-400">{new Date(b.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-sm font-medium text-neutral-800">{b.taskIds.length} tasks • {b.totalHours} hrs</div>
                      <div className="text-xs text-neutral-500 mt-1 line-clamp-1">Areas: {b.areasInvolved.join(', ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile backdrop overlay */}
        {isDrawerOpen && (
          <div
            className="md:hidden fixed inset-0 bg-neutral-900/20 z-10"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />
        )}
      </main>

      {/* Task Modal (Create/Edit) */}
      {(isCreating || editingTask) && (
         <div className="fixed inset-0 bg-neutral-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
                <h2 className="text-lg font-bold text-neutral-800">{isCreating ? 'Create Task' : 'Edit Task'}</h2>
                <button onClick={() => { setIsCreating(false); setEditingTask(null); }} className="p-1 text-neutral-500 hover:text-neutral-800 focus:ring-2 focus:ring-emerald-500 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                <form
                  id="taskForm"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const hours = Number(fd.get('estimatedHours'));
                    if (hours < 0 || hours > 100) {
                       alert("Hours must be between 0 and 100");
                       return;
                    }
                    const title = fd.get('title') as string;
                    if (!title.trim()) {
                       alert("Title is required");
                       return;
                    }

                    const task: WorkTask = {
                      id: editingTask?.id || '',
                      title,
                      description: fd.get('description') as string,
                      status: fd.get('status') as TaskStatus,
                      estimatedHours: hours,
                      assignedArea: fd.get('assignedArea') as string
                    };
                    handleSaveTask(task);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="title">Title <span className="text-red-500">*</span></label>
                    <input type="text" id="title" name="title" required defaultValue={editingTask?.title || ''} className="w-full border border-neutral-300 rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="description">Description</label>
                    <textarea id="description" name="description" rows={3} defaultValue={editingTask?.description || ''} className="w-full border border-neutral-300 rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="status">Status</label>
                      <select id="status" name="status" defaultValue={editingTask?.status || 'draft'} className="w-full border border-neutral-300 rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                        <option value="empty">Empty</option>
                        <option value="draft">Draft</option>
                        <option value="ready">Ready</option>
                        <option value="changed">Changed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="estimatedHours">Est. Hours</label>
                      <input type="number" id="estimatedHours" name="estimatedHours" min="0" max="100" step="0.5" required defaultValue={editingTask?.estimatedHours || 1} className="w-full border border-neutral-300 rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="assignedArea">Assigned Area</label>
                    <input type="text" id="assignedArea" name="assignedArea" defaultValue={editingTask?.assignedArea || ''} className="w-full border border-neutral-300 rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                </form>
              </div>
              <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-end space-x-2">
                 <button type="button" onClick={() => { setIsCreating(false); setEditingTask(null); }} className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded hover:bg-neutral-100">Cancel</button>
                 <button type="submit" form="taskForm" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 shadow-sm focus:ring-2 focus:ring-emerald-500">Save Task</button>
              </div>
            </div>
         </div>
      )}
    </div>
  );
}
