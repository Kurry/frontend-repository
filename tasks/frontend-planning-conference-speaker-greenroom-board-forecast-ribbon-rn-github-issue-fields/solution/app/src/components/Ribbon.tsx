import React from 'react';
import type { Record, RecordStatus } from '../types';

interface RibbonProps {
  selectedRecord: Record | null;
  onUpdate: (record: Record) => void;
  onUndo: () => void;
  canUndo: boolean;
}

export function Ribbon({ selectedRecord, onUpdate, onUndo, canUndo }: RibbonProps) {
  if (!selectedRecord) {
    return (
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 min-h-[100px]">
        Select a record below to adjust on the forecast ribbon.
      </div>
    );
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ ...selectedRecord, status: e.target.value as RecordStatus });
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...selectedRecord, forecastScore: parseInt(e.target.value, 10) });
  };

  return (
    <div className="p-4 border-b border-gray-200 bg-white shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between min-h-[100px] transition-all duration-300">
      <div className="flex-1 w-full md:w-auto">
        <h2 className="text-lg font-semibold mb-2">Forecast Ribbon: {selectedRecord.title || 'Untitled'}</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="ribbon-status" className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</label>
            <select
              id="ribbon-status"
              value={selectedRecord.status}
              onChange={handleStatusChange}
              className="border border-gray-300 rounded p-1 text-sm flex-1 sm:flex-none"
            >
              <option value="empty">Empty</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="ribbon-score" className="text-sm font-medium text-gray-700 whitespace-nowrap">Forecast Score ({selectedRecord.forecastScore}):</label>
            <input
              id="ribbon-score"
              type="range"
              min="0"
              max="100"
              value={selectedRecord.forecastScore}
              onChange={handleScoreChange}
              className="flex-1 sm:w-32"
            />
          </div>
        </div>
      </div>
      <div>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded text-sm font-medium transition-colors"
        >
          Undo Last Mutation
        </button>
      </div>
    </div>
  );
}
