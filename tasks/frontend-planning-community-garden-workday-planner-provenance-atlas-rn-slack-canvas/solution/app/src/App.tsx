import { useState, useEffect, useMemo } from 'react';
import type { WorkTask, DerivedState, HistoryEvent, CommunityGardenWorkdayPlannerSession } from './types';
import { WorkTasks } from './components/WorkTasks';
import { ProvenanceAtlas } from './components/ProvenanceAtlas';
import { ArtifactManager } from './components/ArtifactManager';
import { setupWebMCP } from './webmcp';

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

function App() {
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [lastExportedAt, setLastExportedAt] = useState<string | null>(null);
  const [isWebMCPLoaded, setIsWebMCPLoaded] = useState(false);

  // Calculate derived state
  const derivedState = useMemo<DerivedState>(() => {
    const draftTasks = tasks.filter(t => t.status === 'draft').length;
    const readyTasks = tasks.filter(t => t.status === 'ready').length;
    const changedTasks = tasks.filter(t => t.status === 'changed').length;
    const archivedTasks = tasks.filter(t => t.status === 'archived').length;
    const totalBudget = tasks.reduce((sum, t) => sum + (t.budget || 0), 0);

    let summary = 'No tasks recorded yet.';
    if (tasks.length > 0) {
      if (draftTasks === tasks.length) summary = 'All tasks are in planning phase.';
      else if (readyTasks === tasks.length) summary = 'All tasks are ready for execution.';
      else summary = `Collection has ${readyTasks} ready and ${draftTasks} draft tasks.`;
    }

    return {
      totalTasks: tasks.length,
      draftTasks,
      readyTasks,
      changedTasks,
      archivedTasks,
      totalBudget,
      summary
    };
  }, [tasks]);

  const selectedTask = useMemo(() =>
    tasks.find(t => t.id === selectedTaskId) || null
  , [tasks, selectedTaskId]);

  const addEventToHistory = (event: Omit<HistoryEvent, 'timestamp'>) => {
    setHistory(prev => [...prev, {
      ...event,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleAddRecord = (record: Partial<WorkTask>) => {
    const newRecord: WorkTask = {
      id: generateId(),
      title: record.title || 'New Task',
      description: record.description || '',
      status: record.status || 'draft',
      budget: record.budget || 0,
      dependencies: record.dependencies || [],
      provenanceStatus: 'idle',
      ...record
    };

    setTasks(prev => [...prev, newRecord]);
    addEventToHistory({
      taskId: newRecord.id,
      action: 'create',
      newState: newRecord
    });

    return newRecord.id;
  };

  const handleUpdateRecord = (id: string, updates: Partial<WorkTask>) => {
    setTasks(prev => {
      const taskIndex = prev.findIndex(t => t.id === id);
      if (taskIndex === -1) return prev;

      const oldTask = prev[taskIndex];
      const newTask = { ...oldTask, ...updates };
      const newTasks = [...prev];
      newTasks[taskIndex] = newTask;

      let action: HistoryEvent['action'] = 'update';
      if (updates.status === 'archived' && oldTask.status !== 'archived') {
        action = 'archive';
      } else if (updates.provenanceStatus === 'conflict' && oldTask.provenanceStatus !== 'conflict') {
        action = 'quarantine';
      }

      addEventToHistory({
        taskId: id,
        action,
        previousState: oldTask,
        newState: newTask
      });

      return newTasks;
    });
  };


  const handleUndo = () => {
    if (history.length === 0) return;

    const lastEvent = history[history.length - 1];

    if (lastEvent.action === 'create') {
      setTasks(prev => prev.filter(t => t.id !== lastEvent.taskId));
      if (selectedTaskId === lastEvent.taskId) setSelectedTaskId(null);
    } else if (lastEvent.action === 'update' || lastEvent.action === 'archive' || lastEvent.action === 'quarantine') {
      if (lastEvent.previousState) {
        setTasks(prev => {
          const index = prev.findIndex(t => t.id === lastEvent.taskId);
          if (index === -1) {
            // Task was deleted, restore it
            return [...prev, lastEvent.previousState];
          }
          // Restore previous state
          const newTasks = [...prev];
          newTasks[index] = lastEvent.previousState;
          return newTasks;
        });
      } else {
        // Task was created? Shouldn't happen with these action types
      }
    }

    setHistory(prev => prev.slice(0, -1));
  };

  const handleExport = () => {
    const session: CommunityGardenWorkdayPlannerSession = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: tasks,
      derived: derivedState,
      history
    };

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `garden-workday-v1-provenance-atlas-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setLastExportedAt(session.exportedAt);
    return session;
  };

  const handleImport = (session: CommunityGardenWorkdayPlannerSession) => {
    setTasks(session.records || []);
    setHistory(session.history || []);
    setLastExportedAt(new Date().toISOString()); // Regenerate on import
    setSelectedTaskId(null);
  };

  const handleClear = () => {
    setTasks([]);
    setHistory([]);
    setSelectedTaskId(null);
    setLastExportedAt(null);
  };

  // Bind globals for WebMCP
  useEffect(() => {
    window.__appState = {
      createRecord: handleAddRecord,
      updateRecord: handleUpdateRecord,
      exportSession: () => {
        const exportedAt = new Date().toISOString();
        setLastExportedAt(exportedAt);
        return {
          schemaVersion: 'v1',
          exportedAt,
          records: tasks,
          derived: derivedState,
          history
        };
      },
      importSession: handleImport
    };

    if (!isWebMCPLoaded) {
      setupWebMCP();
      setIsWebMCPLoaded(true);
    }
  }, [tasks, history, derivedState, isWebMCPLoaded]);

  // Handle keyboard undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history]);

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden text-slate-800">
      <header className="bg-emerald-800 text-white p-4 shadow-md flex justify-between items-center z-10 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Community Garden Workday Planner</h1>
          <p className="text-emerald-200 text-sm opacity-90">Manage work tasks and trace provenance</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left Column: Collection */}
        <div className="w-full md:w-1/2 lg:w-5/12 xl:w-1/3 flex flex-col h-full border-r border-slate-200 min-h-0">
          <div className="flex-1 overflow-hidden">
            <WorkTasks
              tasks={tasks}
              onAdd={handleAddRecord}
              onUpdate={handleUpdateRecord}

              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          </div>
        </div>

        {/* Right Column: Surface & Inspector */}
        <div className="w-full md:w-1/2 lg:w-7/12 xl:w-2/3 flex flex-col h-full bg-slate-50 min-h-0">
          <div className="flex-1 overflow-hidden">
            <ProvenanceAtlas
              selectedTask={selectedTask}
              derivedState={derivedState}
              onUpdateTask={handleUpdateRecord}
              onUndoLastMutation={handleUndo}
            />
          </div>

          <div className="shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 relative">
            <ArtifactManager
              onExport={handleExport}
              onImport={handleImport}
              onClear={handleClear}
              lastExportedAt={lastExportedAt}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
