import { useState } from 'react';
import { useStateContext, seedRecords } from './store';
import type { LessonBlock, LessonStatus } from './store';
import { Plus, Archive, Edit2, Undo, Upload, Download, Trash2, GitBranch } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const { state, dispatch } = useStateContext();

  return (
    <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col gap-6 shrink-0 h-full overflow-y-auto">
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Derived Summary</h2>
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Total Blocks</span>
            <span className="font-semibold">{state.derived.summary.totalBlocks}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Ready</span>
            <span className="font-semibold text-emerald-600">{state.derived.summary.readyBlocks}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Scenarios Branched</span>
            <span className="font-semibold text-blue-600">{state.derived.summary.scenarioBranches}</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Actions</h2>
        <div className="flex flex-col gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            onClick={() => dispatch({ type: 'CREATE_RECORD', payload: { title: 'New Lesson', details: '', status: 'draft' } })}
          >
            <Plus className="w-4 h-4" /> Add Lesson Block
          </button>

          <button
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
            onClick={() => dispatch({ type: 'UNDO' })}
            disabled={state.historyStack.length === 0}
          >
            <Undo className="w-4 h-4" /> Undo Last Action
          </button>
        </div>
      </div>

      <div className="mt-auto">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Artifact Tools</h2>
        <div className="flex flex-col gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
            onClick={() => {
              const exportData = {
                schemaVersion: state.schemaVersion,
                exportedAt: new Date().toISOString(),
                records: state.records,
                derived: state.derived,
                history: state.history
              };
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'lesson-arc-v1-scenario-weaver.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="w-4 h-4" /> Export Artifact
          </button>

          <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" /> Import Artifact
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const data = JSON.parse(ev.target?.result as string);
                    if (data.schemaVersion === 'v1') {
                      dispatch({ type: 'IMPORT_STATE', payload: { ...data, exportedAt: new Date().toISOString() } });
                    } else {
                      alert('Invalid schema version');
                    }
                  } catch (err) {
                    alert('Invalid JSON file');
                  }
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
          </label>
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
            onClick={() => dispatch({ type: 'CLEAR_STATE' })}
          >
            <Trash2 className="w-4 h-4" /> Clear Session
          </button>

          <button
            className="flex items-center justify-center gap-2 px-3 py-2 mt-4 text-xs font-medium bg-slate-800 text-slate-200 rounded-md hover:bg-slate-900 transition-colors"
            onClick={() => {
              const records = seedRecords(100);
              dispatch({
                type: 'IMPORT_STATE',
                payload: {
                  schemaVersion: 'v1',
                  exportedAt: new Date().toISOString(),
                  records,
                  derived: { summary: { totalBlocks: records.length, readyBlocks: 20, scenarioBranches: 0 } },
                  history: [],
                  selectedRecordId: null,
                  historyStack: []
                }
              });
            }}
          >
            Seed 100+ Records
          </button>
        </div>
      </div>
    </div>
  );
}

const statusColors: Record<LessonStatus, string> = {
  empty: 'bg-slate-100 text-slate-600',
  draft: 'bg-amber-100 text-amber-700',
  ready: 'bg-emerald-100 text-emerald-700',
  changed: 'bg-blue-100 text-blue-700',
  archived: 'bg-slate-200 text-slate-500'
};

export function MainCanvas() {
  const { state, dispatch } = useStateContext();
  const [filter, setFilter] = useState<LessonStatus | 'all'>('all');

  const visibleRecords = state.records
    .filter(r => r.status !== 'archived')
    .filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
      <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Lesson Blocks</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 mr-2">Filter:</span>
          {(['all', 'empty', 'draft', 'ready', 'changed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full transition-colors",
                filter === f ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {visibleRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Archive className="w-12 h-12 mb-4 opacity-50" />
            <p>No lesson blocks found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {visibleRecords.map(record => (
              <div
                key={record.id}
                tabIndex={0}
                className={cn(
                  "group relative rounded-xl border p-5 cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                  state.selectedRecordId === record.id
                    ? "border-indigo-500 shadow-md bg-indigo-50/30 ring-1 ring-indigo-500"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white"
                )}
                onClick={() => dispatch({ type: 'SELECT_RECORD', payload: record.id })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    dispatch({ type: 'SELECT_RECORD', payload: record.id });
                  }
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-slate-900 truncate pr-4">{record.title}</h3>
                  <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider shrink-0", statusColors[record.status])}>
                    {record.status}
                  </span>
                </div>
                <p className="text-slate-600 text-sm line-clamp-2 mb-4 h-10">{record.details || <span className="italic text-slate-400">No details provided</span>}</p>

                {record.scenarioState.isBranched && (
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-2 mt-2 flex items-center gap-2 text-xs text-blue-700">
                    <GitBranch className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Branched scenario: {record.scenarioState.outcomeNotes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function InspectorPanel() {
  const { state, dispatch } = useStateContext();
  const record = state.records.find(r => r.id === state.selectedRecordId);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!record) {
    return (
      <div className="w-full md:w-80 lg:w-96 bg-white border-l border-slate-200 p-6 flex flex-col justify-center items-center h-full shrink-0">
        <Edit2 className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-slate-500 text-center">Select a lesson block to view details or branch into a scenario.</p>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<LessonBlock>) => {
    // Validate boundaries (e.g. empty title)
    if (updates.title !== undefined && updates.title.trim() === '') {
      setErrorMsg('Title cannot be empty. Reverting to previous state.');
      setTimeout(() => setErrorMsg(''), 3000);
      return; // reject invalid bounds without partial updates
    }
    dispatch({ type: 'UPDATE_RECORD', payload: { ...record, ...updates } });
  };

  const handleBranch = () => {
    if (!outcomeNotes.trim()) {
      setErrorMsg('Scenario outcome notes are required to branch.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    dispatch({ type: 'BRANCH_SCENARIO', payload: { id: record.id, outcomeNotes } });
    setOutcomeNotes('');
  };

  return (
    <div className="w-full md:w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 overflow-hidden shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h2 className="font-bold text-slate-800">Inspector</h2>
        <button
          onClick={() => dispatch({ type: 'SELECT_RECORD', payload: null })}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          &times;
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm font-medium">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Title</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={record.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
            <select
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              value={record.status}
              onChange={(e) => handleUpdate({ status: e.target.value as LessonStatus })}
            >
              <option value="empty">Empty</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Details</label>
            <textarea
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[100px] resize-none"
              value={record.details}
              onChange={(e) => handleUpdate({ details: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <GitBranch className="w-4 h-4 text-indigo-500" /> Scenario Weaver
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Branch this selected record into a scenario and compare linked outcomes. This creates a new derived record for testing alternatives.
          </p>

          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="e.g. Try a 15-min interactive quiz"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBranch();
              }}
            />
            <button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
              onClick={handleBranch}
            >
              Branch Scenario
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 mt-auto">
           <button
              className="w-full bg-red-50 text-red-600 hover:bg-red-100 font-medium py-2 rounded-md text-sm transition-colors flex items-center justify-center gap-2 border border-red-200"
              onClick={() => dispatch({ type: 'DELETE_RECORD', payload: record.id })}
            >
              <Archive className="w-4 h-4" /> Archive Record
            </button>
        </div>
      </div>
    </div>
  );
}
