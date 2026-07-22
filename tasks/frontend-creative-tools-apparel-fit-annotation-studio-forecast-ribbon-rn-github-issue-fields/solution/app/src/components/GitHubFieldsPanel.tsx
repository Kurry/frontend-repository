import React from 'react';
import { useStore } from '../store';
import { GitMerge, Clock, Hash, Tag } from 'lucide-react';

export const GitHubFieldsPanel: React.FC = () => {
  const { records, selectedRecordId } = useStore();
  const selectedRecord = records.find(r => r.id === selectedRecordId);

  if (!selectedRecord) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 p-6 flex flex-col items-center justify-center text-gray-500 shrink-0">
        <Hash className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-sm text-center">Select a record to view project evidence and metadata.</p>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto shrink-0 flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Project Evidence</h3>

        <div className="space-y-4">
          <div className="flex flex-col gap-1 text-sm border-b pb-3 border-gray-100">
            <span className="text-gray-500 flex items-center gap-2"><Tag className="w-4 h-4"/> Status</span>
            <span className="font-medium capitalize">{selectedRecord.status}</span>
          </div>

          <div className="flex flex-col gap-1 text-sm border-b pb-3 border-gray-100">
            <span className="text-gray-500 flex items-center gap-2"><Hash className="w-4 h-4"/> Record ID</span>
            <span className="font-mono text-xs">{selectedRecord.id}</span>
          </div>

          <div className="flex flex-col gap-1 text-sm border-b pb-3 border-gray-100">
            <span className="text-gray-500 flex items-center gap-2"><GitMerge className="w-4 h-4"/> Duplicate Merge</span>
            {selectedRecord['duplicate-merge-id'] ? (
              <span className="text-blue-600 font-mono text-xs hover:underline cursor-pointer">{selectedRecord['duplicate-merge-id']}</span>
            ) : (
              <span className="text-gray-400 italic">None</span>
            )}
          </div>

          <div className="flex flex-col gap-1 text-sm border-b pb-3 border-gray-100">
            <span className="text-gray-500 flex items-center gap-2"><Tag className="w-4 h-4"/> Saved Query</span>
            {selectedRecord['saved-query'] ? (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded w-fit">{selectedRecord['saved-query']}</span>
            ) : (
              <span className="text-gray-400 italic">None</span>
            )}
          </div>

          <div className="flex flex-col gap-1 text-sm pb-3">
            <span className="text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4"/> Release Provenance</span>
            {selectedRecord['release-provenance'] ? (
              <span className="font-mono text-purple-600">{selectedRecord['release-provenance']}</span>
            ) : (
              <span className="text-gray-400 italic">Unreleased</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
