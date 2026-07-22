import React, { useState, useEffect } from 'react';
import { StoreProvider } from './storeProvider';
import { useStore, TaskStatus } from './store';
import { TaskForm } from './components/TaskForm';
import { ScenarioWeaver } from './components/ScenarioWeaver';
import { Undo, Download, Upload, Plus, Trash2 } from 'lucide-react';

const MainApp = () => {
  const { state, createRecord, updateRecord, deleteRecord, undo, exportSession, importSession, setSelectedTask, clearSession } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');

  // Handle Ctrl/Cmd+Z for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const handleExport = () => {
    const data = exportSession();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'garden-workday-v1-scenario-weaver.json';
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
        clearSession();
        importSession(json);
      } catch (err) {
        console.error("Failed to parse import:", err);
      }
    };
    reader.readAsText(file);
  };

  const filteredRecords = filter === 'all'
    ? state.records
    : state.records.filter(r => r.status === filter);

  useEffect(() => {
    (window as any).__storeBridge = {
      createRecord,
      updateRecord,
      exportSession,
      importSession
    };
  }, [createRecord, updateRecord, exportSession, importSession]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-green-800 text-white p-4 shadow-md flex justify-between items-center shrink-0">
        <h1 className="text-xl font-bold">Community Garden Workday Planner</h1>
        <div className="flex gap-4 items-center">
          <div className="text-sm bg-green-900 px-3 py-1 rounded">
            Total Hours: <span className="font-bold">{state.derived.summary.totalEstimatedHours}h</span>
            <span className="mx-2">|</span>
            Scenarios: <span className="font-bold">{state.derived.summary.scenarioChanges}</span>
          </div>
          <button onClick={undo} disabled={state.historyStack.length === 0} className="p-2 hover:bg-green-700 rounded disabled:opacity-50" title="Undo (Cmd/Ctrl+Z)">
            <Undo size={20} />
          </button>
          <button onClick={handleExport} className="p-2 hover:bg-green-700 rounded flex gap-2 items-center" title="Export Session">
            <Download size={20} /> <span className="hidden sm:inline">Export</span>
          </button>
          <label className="p-2 hover:bg-green-700 rounded cursor-pointer flex gap-2 items-center" title="Import Session">
            <Upload size={20} /> <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* Sidebar / List */}
        <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col h-full bg-white border-r">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="border rounded px-2 py-1 text-sm bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="empty">Empty</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded shadow flex items-center justify-center w-8 h-8"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {isCreating && (
              <div className="mb-4">
                <TaskForm
                  onSubmit={(data) => {
                    createRecord(data);
                    setIsCreating(false);
                  }}
                  onCancel={() => setIsCreating(false)}
                />
              </div>
            )}

            {filteredRecords.map(record => (
              <div
                key={record.id}
                onClick={() => setSelectedTask(record.id)}
                className={`p-3 border rounded cursor-pointer transition-all ${state.selectedTaskId === record.id ? 'border-blue-500 bg-blue-50 shadow' : 'hover:border-gray-400 bg-white'}`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">{record.title}</h4>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded capitalize">{record.status}</span>
                    {record.scenarioWeaverState?.branchedRecordId && (
                      <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">Has Branch</span>
                    )}
                    {record.scenarioWeaverState?.baseRecordId && (
                      <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Is Branch</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                      className="text-red-500 hover:bg-red-100 p-1 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">{record.description}</div>
                <div className="text-sm font-medium mt-2">{record.estimatedHours}h</div>
              </div>
            ))}
            {filteredRecords.length === 0 && !isCreating && (
              <div className="p-4 text-center text-gray-500">No records found.</div>
            )}
          </div>
        </div>

        {/* Detail / Scenario Weaver */}
        <div className="flex-1 h-full">
          <ScenarioWeaver />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}
