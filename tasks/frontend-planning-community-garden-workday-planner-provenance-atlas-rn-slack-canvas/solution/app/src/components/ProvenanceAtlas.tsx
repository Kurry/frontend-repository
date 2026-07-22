
import type { WorkTask, DerivedState } from '../types';
import { GitCommit, AlertTriangle, CheckCircle, Search, CornerUpLeft } from 'lucide-react';

interface ProvenanceAtlasProps {
  selectedTask: WorkTask | null;
  derivedState: DerivedState;
  onUpdateTask: (id: string, updates: Partial<WorkTask>) => void;
  onUndoLastMutation: () => void;
}

export function ProvenanceAtlas({
  selectedTask,
  derivedState,
  onUpdateTask,
  onUndoLastMutation
}: ProvenanceAtlasProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <GitCommit size={18} className="text-indigo-600" />
          Provenance Atlas
        </h2>
        <button
          onClick={onUndoLastMutation}
          className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
          aria-label="Undo last mutation"
        >
          <CornerUpLeft size={14} /> Undo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {selectedTask ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Selected Record</div>
                  <h3 className="text-xl font-medium text-slate-900">{selectedTask.title}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${
                  selectedTask.provenanceStatus === 'conflict' ? 'bg-red-50 text-red-700 border-red-200' :
                  selectedTask.provenanceStatus === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                  selectedTask.provenanceStatus === 'selected' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  State: {selectedTask.provenanceStatus || 'idle'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-slate-500 mb-1">Current Status</div>
                  <div className="font-medium capitalize text-slate-800">{selectedTask.status}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-slate-500 mb-1">Assigned Budget</div>
                  <div className="font-medium text-slate-800">${selectedTask.budget || 0}</div>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-5">
                <h4 className="text-sm font-medium text-slate-700">Lineage Actions</h4>

                <button
                  onClick={() => onUpdateTask(selectedTask.id, { provenanceStatus: 'selected' })}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full">
                      <Search size={16} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-slate-800 group-hover:text-indigo-900">Trace to source evidence</div>
                      <div className="text-xs text-slate-500">Inspect lineage and dependencies</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => onUpdateTask(selectedTask.id, { provenanceStatus: 'conflict' })}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 text-red-600 p-2 rounded-full">
                      <AlertTriangle size={16} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-slate-800 group-hover:text-red-900">Quarantine bad lineage</div>
                      <div className="text-xs text-slate-500">Mark record as conflicting</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => onUpdateTask(selectedTask.id, { provenanceStatus: 'resolved' })}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 text-green-600 p-2 rounded-full">
                      <CheckCircle size={16} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-slate-800 group-hover:text-green-900">Resolve provenance</div>
                      <div className="text-xs text-slate-500">Approve lineage as verified</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="text-sm font-medium text-slate-700 mb-4">Derived Collection Summary</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-light text-slate-800">{derivedState.totalTasks}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Total Tasks</div>
                </div>
                <div>
                  <div className="text-2xl font-light text-emerald-600">${derivedState.totalBudget}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Total Budget</div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex justify-between items-center">
                  <span>Draft</span>
                  <span className="bg-slate-100 px-2 rounded-full">{derivedState.draftTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Ready</span>
                  <span className="bg-blue-50 text-blue-700 px-2 rounded-full">{derivedState.readyTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Changed</span>
                  <span className="bg-amber-50 text-amber-700 px-2 rounded-full">{derivedState.changedTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Archived</span>
                  <span className="bg-slate-100 px-2 rounded-full">{derivedState.archivedTasks}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 border border-slate-100 italic">
                "{derivedState.summary}"
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <GitCommit size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-500 mb-1">No record selected</p>
            <p className="text-sm text-center max-w-xs">
              Select a work task from the collection to trace its provenance and view lineage actions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
