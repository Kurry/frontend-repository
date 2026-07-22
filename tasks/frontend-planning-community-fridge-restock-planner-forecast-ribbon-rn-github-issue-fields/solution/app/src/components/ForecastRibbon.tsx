import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { RecordStatus } from '../types';

export default function ForecastRibbon() {
  const records = useStore((state) => state.records);
  const selectedRecordId = useStore((state) => state.selectedRecordId);
  const updateRecord = useStore((state) => state.updateRecord);
  const undo = useStore((state) => state.undo);

  const selectedRecord = records.find(r => r.id === selectedRecordId);

  const [forecastStatus, setForecastStatus] = useState<RecordStatus | null>(null);

  useEffect(() => {
    if (selectedRecord) {
      setForecastStatus(selectedRecord.status);
    } else {
      setForecastStatus(null);
    }
  }, [selectedRecord]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  if (!selectedRecord) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-slate-500">
        Select a task to forecast outcomes.
      </div>
    );
  }

  const handleForecast = (status: RecordStatus) => {
    setForecastStatus(status);
  };

  const applyForecast = () => {
    if (forecastStatus && forecastStatus !== selectedRecord.status) {
      updateRecord(selectedRecord.id, selectedRecord.task, forecastStatus);
    }
  };

  const statuses: RecordStatus[] = ['draft', 'ready', 'changed', 'archived'];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold">
        Forecast Ribbon
      </div>
      <div className="p-4 flex-1">
        <h3 className="font-medium text-lg mb-2">{selectedRecord.task}</h3>
        <p className="text-sm text-slate-600 mb-6">Current Status: <span className="font-semibold">{selectedRecord.status}</span></p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Project Outcome (Forecast)</label>
          <div className="flex gap-2">
            {statuses.map(status => (
              <button
                key={status}
                onClick={() => handleForecast(status)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  forecastStatus === status
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {forecastStatus !== selectedRecord.status && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Projected Outcome:</h4>
            <p className="text-sm text-blue-800 mb-2">
              Status will change to <span className="font-bold">{forecastStatus}</span>. This will update the derived summary totals.
            </p>
            <button
              onClick={applyForecast}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Apply Forecast Mutation
            </button>
          </div>
        )}

      </div>
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-500">
        Press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs">Cmd/Ctrl + Z</kbd> to undo.
      </div>
    </div>
  );
}