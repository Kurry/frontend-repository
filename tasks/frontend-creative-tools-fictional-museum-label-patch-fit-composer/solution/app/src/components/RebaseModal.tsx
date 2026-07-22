import React, { useState } from 'react';
import { useStore } from '../store/index';

export const RebaseModal: React.FC = () => {
  const workspace = useStore((state) => state.rebaseWorkspace);
  const cancelRebase = useStore((state) => state.cancelRebase);
  const commitRebase = useStore((state) => state.commitRebase);

  const [composedText, setComposedText] = useState('');

  if (!workspace) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">Three-way Rebase Resolution</h2>
          <button onClick={cancelRebase} className="text-gray-500 hover:text-black">&times; Cancel</button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 flex-1 overflow-y-auto">
          <div className="border border-gray-200 rounded p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-2">Base (Hash: {workspace.baseRevisionId})</h3>
            <div className="text-sm font-serif">Original text here...</div>
          </div>
          <div className="border border-blue-200 rounded p-4 bg-blue-50">
            <h3 className="font-semibold text-blue-800 mb-2">Current (Hash: {workspace.currentRevisionId})</h3>
            <div className="text-sm font-serif">Current overlapping text here...</div>
          </div>
          <div className="border border-green-200 rounded p-4 bg-green-50">
            <h3 className="font-semibold text-green-800 mb-2">Patch (ID: {workspace.patchId})</h3>
            <div className="text-sm font-serif">Patch replacement text here...</div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold mb-2">Resolution</h3>
          <div className="flex space-x-4 mb-4">
            <button
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-800"
              onClick={() => commitRebase('keep')}
            >
              Keep current
            </button>
            <button
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded text-blue-800"
              onClick={() => commitRebase('apply')}
            >
              Apply patch
            </button>
          </div>

          <div className="mt-4">
            <label className="block font-semibold mb-2 text-sm text-gray-700">Compose Exact Result</label>
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded px-3 py-2"
                value={composedText}
                onChange={(e) => setComposedText(e.target.value)}
                placeholder="Type resolved text here..."
              />
              <button
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
                onClick={() => commitRebase('compose', composedText)}
                disabled={!composedText}
              >
                Compose
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
