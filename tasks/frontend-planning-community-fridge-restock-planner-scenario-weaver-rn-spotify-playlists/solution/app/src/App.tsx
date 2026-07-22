import { useState, useEffect, useCallback } from 'react';
import { RestockList } from './components/RestockList';
import { RestockForm } from './components/RestockForm';
import { ScenarioWeaver } from './components/ScenarioWeaver';
import { ArtifactExport } from './components/ArtifactExport';
import type { AppState, RestockTask, HistoryEvent, RestockStatus } from './types';
import { Plus, Undo2, LayoutDashboard } from 'lucide-react';

const getInitialState = (): AppState => ({
  schemaVersion: 'v1',
  exportedAt: '',
  records: [],
  derived: {
    summary: {
      totalItems: 0,
      draftCount: 0,
      readyCount: 0,
      changedCount: 0,
      archivedCount: 0,
    }
  },
  history: []
});

function App() {
  const [state, setState] = useState<AppState>(getInitialState());
  const [historyStack, setHistoryStack] = useState<AppState[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RestockTask | null>(null);
  const [branchingTask, setBranchingTask] = useState<RestockTask | null>(null);

  const calculateDerivedState = (records: RestockTask[]) => {
    return {
      summary: {
        totalItems: records.length,
        draftCount: records.filter(r => r.status === 'draft').length,
        readyCount: records.filter(r => r.status === 'ready').length,
        changedCount: records.filter(r => r.status === 'changed').length,
        archivedCount: records.filter(r => r.status === 'archived').length,
      }
    };
  };

  const updateStateWithHistory = useCallback((newRecords: RestockTask[], action: string, details: string, taskId?: string) => {
    setState(prev => {
      setHistoryStack(stack => [...stack, prev]);
      const newHistoryEvent: HistoryEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        action,
        details,
        taskId
      };

      return {
        ...prev,
        records: newRecords,
        derived: calculateDerivedState(newRecords),
        history: [...prev.history, newHistoryEvent]
      };
    });
  }, []);

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previousState = historyStack[historyStack.length - 1];
    setState(previousState);
    setHistoryStack(stack => stack.slice(0, -1));
  };

  const handleSaveTask = (task: RestockTask) => {
    const isNew = !state.records.find(r => r.id === task.id);
    const newRecords = isNew
      ? [...state.records, task]
      : state.records.map(r => r.id === task.id ? task : r);

    updateStateWithHistory(
      newRecords,
      isNew ? 'CREATE' : 'EDIT',
      isNew ? `Created task ${task.name}` : `Edited task ${task.name}`,
      task.id
    );
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (id: string) => {
    const task = state.records.find(r => r.id === id);
    const newRecords = state.records.filter(r => r.id !== id);
    updateStateWithHistory(
      newRecords,
      'DELETE',
      `Deleted task ${task?.name}`,
      id
    );
  };

  const handleArchiveTask = (task: RestockTask) => {
    const newRecords = state.records.map(r =>
      r.id === task.id ? { ...r, status: 'archived' as RestockStatus } : r
    );
    updateStateWithHistory(
      newRecords,
      'ARCHIVE',
      `Archived task ${task.name}`,
      task.id
    );
  };

  const handleConfirmScenario = (branchedTask: RestockTask) => {
    const newRecords = state.records.map(r =>
      r.id === branchedTask.id ? branchedTask : r
    );
    updateStateWithHistory(
      newRecords,
      'BRANCH_SCENARIO',
      `Applied scenario branch to task ${branchedTask.name}`,
      branchedTask.id
    );
    setBranchingTask(null);
  };

  const handleClearData = () => {
    setState(getInitialState());
    setHistoryStack([]);
  };

  const handleImportData = (importedState: AppState) => {
    setState(importedState);
    setHistoryStack([]); // Clear undo history on fresh import
  };

  // WebMCP Contract Implementation
  useEffect(() => {
    const w = window as any;

    // Use functional state updates to avoid stale closures.
    // For reads, we need a ref to the current state since tools are called from the outside.

    w.webmcp_session_info = {
      task: "eval-intelligence/frontend-planning-community-fridge-restock-planner-scenario-weaver-rn-spotify-playlists"
    };

    w.webmcp_list_tools = () => {
      return [
        {
          name: "entity_create_record",
          description: "Create a new restock task",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string" },
              itemCategory: { type: "string" },
              quantity: { type: "number" },
              unit: { type: "string" }
            },
            required: ["name", "itemCategory", "quantity", "unit"]
          }
        },
        {
          name: "entity_update_record",
          description: "Update an existing restock task status or details",
          parameters: {
            type: "object",
            properties: {
              id: { type: "string" },
              status: { type: "string", enum: ["draft", "ready", "changed", "archived"] },
              name: { type: "string" },
              quantity: { type: "number" }
            },
            required: ["id"]
          }
        },
        {
          name: "artifact_export_session_json",
          description: "Export current state to JSON string",
          parameters: { type: "object", properties: {} }
        },
        {
          name: "artifact_import_session_json",
          description: "Import state from JSON string",
          parameters: {
            type: "object",
            properties: {
              jsonString: { type: "string" }
            },
            required: ["jsonString"]
          }
        }
      ];
    };

    w.webmcp_invoke_tool = (toolName: string, args: any) => {
      return new Promise((resolve, reject) => {
        try {
          if (toolName === "entity_create_record") {
            const newTask: RestockTask = {
              id: Math.random().toString(36).substr(2, 9),
              name: args.name,
              itemCategory: args.itemCategory,
              quantity: Number(args.quantity),
              unit: args.unit,
              status: 'draft'
            };

            setState(current => {
              const newRecords = [...current.records, newTask];
              const newState = {
                ...current,
                records: newRecords,
                derived: calculateDerivedState(newRecords),
                history: [...current.history, {
                  id: Math.random().toString(36).substr(2, 9),
                  timestamp: new Date().toISOString(),
                  action: 'CREATE_TOOL',
                  details: `Created task ${newTask.name}`,
                  taskId: newTask.id
                }]
              };
              resolve(newState);
              return newState;
            });

          } else if (toolName === "entity_update_record") {
            setState(current => {
              const taskIndex = current.records.findIndex(r => r.id === args.id);
              if (taskIndex === -1) {
                reject(new Error(`Task with id ${args.id} not found.`));
                return current;
              }
              const updatedTask = { ...current.records[taskIndex] };
              if (args.status) updatedTask.status = args.status as RestockStatus;
              if (args.name) updatedTask.name = args.name;
              if (args.quantity) updatedTask.quantity = Number(args.quantity);

              const newRecords = [...current.records];
              newRecords[taskIndex] = updatedTask;

              const newState = {
                ...current,
                records: newRecords,
                derived: calculateDerivedState(newRecords),
                history: [...current.history, {
                  id: Math.random().toString(36).substr(2, 9),
                  timestamp: new Date().toISOString(),
                  action: 'UPDATE_TOOL',
                  details: `Updated task ${updatedTask.name}`,
                  taskId: updatedTask.id
                }]
              };
              resolve(newState);
              return newState;
            });

          } else if (toolName === "artifact_export_session_json") {
             // For export we need current state, we'll use a functional state update trick to read it.
             setState(current => {
                const dataToExport = {
                  ...current,
                  exportedAt: new Date().toISOString()
                };
                resolve(JSON.stringify(dataToExport));
                return current;
             });
          } else if (toolName === "artifact_import_session_json") {
            const imported = JSON.parse(args.jsonString) as AppState;
            if (imported.schemaVersion !== 'v1') throw new Error("Invalid schema version.");
            imported.exportedAt = new Date().toISOString();
            setState(imported);
            setHistoryStack([]);
            resolve("Imported successfully");
          } else {
            reject(new Error(`Tool ${toolName} not implemented.`));
          }
        } catch (err) {
          reject(err);
        }
      });
    };

    return () => {
      delete w.webmcp_session_info;
      delete w.webmcp_list_tools;
      delete w.webmcp_invoke_tool;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Community Fridge Restock Planner</h1>
            <p className="text-sm text-gray-500">Scenario Weaver Workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleUndo}
            disabled={historyStack.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Undo2 className="w-4 h-4" />
            Undo
          </button>
          <button
            onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-medium text-sm hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left pane: Main list */}
        <div className="flex-1 overflow-hidden flex flex-col h-full border-r border-gray-200">
          <RestockList
            tasks={state.records}
            onEdit={(task) => { setEditingTask(task); setIsFormOpen(true); }}
            onDelete={handleDeleteTask}
            onBranch={setBranchingTask}
            onArchive={handleArchiveTask}
          />
        </div>

        {/* Right pane: Inspector/Summary */}
        <div className="w-full md:w-80 bg-gray-50 overflow-y-auto p-6 flex flex-col border-t md:border-t-0 md:border-l border-gray-200 shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Workspace Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Items</span>
                <span className="font-semibold text-gray-900 text-lg">{state.derived.summary.totalItems}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span> Draft
                </span>
                <span className="font-medium text-gray-700">{state.derived.summary.draftCount}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span> Ready
                </span>
                <span className="font-medium text-gray-700">{state.derived.summary.readyCount}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> Changed
                </span>
                <span className="font-medium text-gray-700">{state.derived.summary.changedCount}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span> Archived
                </span>
                <span className="font-medium text-gray-700">{state.derived.summary.archivedCount}</span>
              </div>
            </div>
          </div>

          <ArtifactExport
            currentState={state}
            onImport={handleImportData}
            onClear={handleClearData}
          />

          <div className="mt-6 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Recent Activity</h3>
            <div className="space-y-4">
              {state.history.slice().reverse().slice(0, 5).map(event => (
                <div key={event.id} className="text-sm relative pl-4 border-l-2 border-gray-200 pb-1">
                  <div className="absolute w-2 h-2 rounded-full bg-gray-400 -left-[5px] top-1.5 border-2 border-white"></div>
                  <p className="text-gray-800 font-medium">{event.action.replace('_', ' ')}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{event.details}</p>
                </div>
              ))}
              {state.history.length === 0 && (
                <p className="text-sm text-gray-400 italic">No activity yet</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {isFormOpen && (
        <RestockForm
          onSave={handleSaveTask}
          onCancel={() => { setIsFormOpen(false); setEditingTask(null); }}
          initialData={editingTask}
        />
      )}

      {branchingTask && (
        <ScenarioWeaver
          task={branchingTask}
          onConfirm={handleConfirmScenario}
          onCancel={() => setBranchingTask(null)}
        />
      )}
    </div>
  );
}

export default App;
