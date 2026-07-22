import React from 'react';
import { useStore } from './store';
import { Undo2, Check, AlertCircle } from 'lucide-react';

export function ScenarioWeaver() {
  const { weaverState, derived, updateWeaverChanges, applyWeaverMutation, undo, undoStack } = useStore();

  if (weaverState.status === 'idle') {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col items-center justify-center text-gray-500" aria-live="polite">
        <p>Select a scenario card to branch and mutate.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Scenario Weaver</h2>
        <div className="flex space-x-2">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
            aria-label="Undo last mutation"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={18} />
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-6">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Derived Summary</span>
          <div className="mt-1 p-3 bg-blue-50 text-blue-800 rounded border border-blue-100" aria-live="polite">
            {derived.summary}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={weaverState.changes.title || ''}
              onChange={(e) => updateWeaverChanges({ title: e.target.value })}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={weaverState.changes.description || ''}
              onChange={(e) => updateWeaverChanges({ description: e.target.value })}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 h-32 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
             <select
               value={weaverState.changes.status || 'draft'}
               onChange={(e) => updateWeaverChanges({ status: e.target.value })}
               className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
             >
               <option value="draft">Draft</option>
               <option value="ready">Ready</option>
               <option value="changed">Changed</option>
               <option value="archived">Archived</option>
             </select>
          </div>
        </div>

        {weaverState.status === 'conflict' && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded flex items-start" aria-live="polite">
            <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Conflict Detected</p>
              <p className="text-sm">Title is required and cannot be empty.</p>
            </div>
          </div>
        )}

      </div>

      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <button
          onClick={applyWeaverMutation}
          disabled={weaverState.status === 'resolved'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded shadow-sm disabled:opacity-50 flex justify-center items-center"
        >
          {weaverState.status === 'resolved' ? (
             <><Check size={18} className="mr-2" /> Resolved</>
          ) : 'Apply Mutation'}
        </button>
      </div>
    </div>
  );
}
