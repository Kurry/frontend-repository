import React from 'react';
import { useAppStore } from './store';
import type { EventStatus } from './types';
import { CheckCircle, Clock, Archive, FileEdit, AlertCircle } from 'lucide-react';

const STATUS_OPTIONS: { value: EventStatus, label: string, icon: React.ReactNode, color: string }[] = [
  { value: 'empty', label: 'Empty', icon: <AlertCircle className="w-4 h-4" />, color: 'bg-gray-100 text-gray-500' },
  { value: 'draft', label: 'Draft', icon: <FileEdit className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'ready', label: 'Ready', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
  { value: 'changed', label: 'Changed', icon: <Clock className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700' },
  { value: 'archived', label: 'Archived', icon: <Archive className="w-4 h-4" />, color: 'bg-gray-200 text-gray-800' },
];

export function ForecastRibbon() {
  const editor = useAppStore(state => state.editor);
  const records = useAppStore(state => state.records);
  const updateRecord = useAppStore(state => state.updateRecord);

  const selectedRecord = records.find(r => r.id === editor.selectedRecordId);

  if (!selectedRecord) {
    return (
      <div className="bg-white border rounded-lg p-6 shadow-sm flex items-center justify-center text-gray-400">
        Select a record to view its forecast ribbon
      </div>
    );
  }

  const handleStatusChange = (newStatus: EventStatus) => {
    updateRecord(selectedRecord.id, { status: newStatus });
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm transition-all duration-300">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Forecast Ribbon</h3>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-500 mb-1">Selected Record</h4>
        <p className="text-base text-gray-900 font-medium">{selectedRecord.title}</p>
        <p className="text-sm text-gray-500 truncate">{selectedRecord.description}</p>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Adjust projected outcome</h4>

        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((status) => {
            const isSelected = selectedRecord.status === status.value;
            // Removed dynamic string replace that might crash react classes processing
            const baseColor = status.color.split(' ')[0];
            const ringColorClass = baseColor === 'bg-gray-100' ? 'ring-gray-500' :
                                   baseColor === 'bg-yellow-100' ? 'ring-yellow-500' :
                                   baseColor === 'bg-blue-100' ? 'ring-blue-500' :
                                   baseColor === 'bg-purple-100' ? 'ring-purple-500' :
                                   'ring-gray-500';

            return (
              <button
                key={status.value}
                onClick={() => handleStatusChange(status.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300
                  ${isSelected ? `${status.color} border-transparent ring-2 ring-offset-1 ${ringColorClass}` : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
                `}
                aria-pressed={isSelected}
              >
                {status.icon}
                <span className="text-sm font-medium">{status.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded p-4 text-sm text-blue-800 flex gap-3 items-start">
         <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
         <div>
            <span className="font-semibold block mb-1">Projected Outcome:</span>
            {selectedRecord.status === 'draft' && 'This event is currently in draft. It will not be actionable until ready.'}
            {selectedRecord.status === 'ready' && 'This event is ready and scheduled.'}
            {selectedRecord.status === 'changed' && 'This event has been modified and may require review.'}
            {selectedRecord.status === 'archived' && 'This event is archived and hidden from active views.'}
            {selectedRecord.status === 'empty' && 'This event requires details before it can be processed.'}
         </div>
      </div>
    </div>
  );
}
