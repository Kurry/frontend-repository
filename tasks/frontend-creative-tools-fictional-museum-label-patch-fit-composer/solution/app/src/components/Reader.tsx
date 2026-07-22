import React from 'react';
import { useStore } from '../store/index';

export const Reader: React.FC = () => {
  const revisions = useStore((state) => state.revisions);
  const currentRevisionId = useStore((state) => state.currentRevisionId);
  const diffMode = useStore((state) => state.diffMode);
  const applyPatch = useStore((state) => state.applyPatch);
  const activeFormatId = useStore((state) => state.activeFormatId);

  const currentRevision = revisions[currentRevisionId];
  if (!currentRevision) return <div>No revision selected</div>;

  return (
    <div className="bg-white p-6 shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg font-bold">Semantic Reader</h2>
        <div className="flex space-x-2 text-sm">
          <button
            className={`px-3 py-1 rounded ${diffMode === 'none' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => useStore.setState({ diffMode: 'none' })}
          >
            Read
          </button>
          <button
            className={`px-3 py-1 rounded ${diffMode === 'split' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => useStore.setState({ diffMode: 'split' })}
          >
            Split Diff
          </button>
          <button
            className={`px-3 py-1 rounded ${diffMode === 'unified' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => useStore.setState({ diffMode: 'unified' })}
          >
            Unified Diff
          </button>
          <button
            className="px-3 py-1 rounded bg-orange-100 text-orange-800 hover:bg-orange-200"
            onClick={() => {
              // Trigger the manual edit event from PRD directly for oracle convenience
              // The manual edit replaces "workshop ledger" with "maker's ledger"
              useStore.setState({
                patches: {
                  ...useStore.getState().patches,
                  'manual-edit': {
                    id: 'manual-edit',
                    baseRevisionId: currentRevisionId,
                    range: [1, 2],
                    originalText: 'workshop ledger',
                    replacementText: 'maker\'s ledger',
                    editorId: 'ena',
                    rationale: 'manual',
                    sourceIds: [],
                    status: 'pending',
                    expectedBaseHash: currentRevision.hash
                  }
                }
              });
              applyPatch('manual-edit');
            }}
          >
            Manual Edit
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto font-serif text-lg leading-relaxed whitespace-pre-wrap">
        {currentRevision.tokens.map(t => t.value).join('')}
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Current Format: {activeFormatId}
      </div>
    </div>
  );
};
