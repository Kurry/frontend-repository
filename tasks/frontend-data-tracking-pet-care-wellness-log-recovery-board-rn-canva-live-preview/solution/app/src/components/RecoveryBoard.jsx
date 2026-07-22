import React, { useState, useEffect } from 'react';
import { ArrowRight, AlertTriangle, CheckCircle, Undo2, X } from 'lucide-react';

export default function RecoveryBoard({
  event,
  onResolve,
  onCancel,
  onUndo,
  canUndo
}) {
  const [boardState, setBoardState] = useState('idle'); // idle, selected, changed, conflict, resolved
  const [resolutionNote, setResolutionNote] = useState('');
  const [adjustedDate, setAdjustedDate] = useState(event ? event.date : '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setBoardState('selected');
      setAdjustedDate(event.date);
      setResolutionNote('');
      setError('');
    }
  }, [event]);

  if (!event) {
    return (
      <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm p-8 items-center justify-center text-gray-500">
        <AlertTriangle size={48} className="mb-4 text-gray-300" />
        <p>Select a failed record from the collection to enter the recovery path.</p>
      </div>
    );
  }

  const handleStateChange = (newState) => {
    setBoardState(newState);
  };

  const validateAndResolve = () => {
    if (!adjustedDate) {
      setError('Adjusted date is required.');
      handleStateChange('conflict');
      return;
    }

    // Simple validation: date cannot be in the past for a future scheduled event
    // For this mockup, let's just ensure it's not empty and follows YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(adjustedDate)) {
      setError('Date must be in YYYY-MM-DD format.');
      handleStateChange('conflict');
      return;
    }

    if (!resolutionNote.trim()) {
      setError('A resolution note is required to repair downstream consequences.');
      handleStateChange('conflict');
      return;
    }

    setError('');
    handleStateChange('resolved');
    onResolve({
      ...event,
      date: adjustedDate,
      resolutionNote,
      status: 'ready' // Resolving moves it back to ready
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-amber-500" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Recovery Board</h2>
        </div>
        <div className="flex gap-2">
          {canUndo && (
             <button
              onClick={onUndo}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-1"
              aria-label="Undo last action"
             >
               <Undo2 size={16} /> Undo
             </button>
          )}
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 focus:outline-none">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Failed Record Details</h3>
          <div className="bg-red-50 border border-red-100 rounded-md p-4">
            <h4 className="font-medium text-red-900">{event.title}</h4>
            <p className="text-sm text-red-700 mt-1">Pet: {event.petName}</p>
            <p className="text-sm text-red-700">Original Date: {event.date}</p>
            {event.errorReason && (
              <div className="mt-3 text-sm bg-white bg-opacity-50 p-2 rounded text-red-800">
                <strong>Failure Reason:</strong> {event.errorReason}
              </div>
            )}
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-white text-sm text-gray-500 flex items-center gap-2">
              <ArrowRight size={16} /> Repair Path
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="adjustedDate" className="block text-sm font-medium text-gray-700">
              Adjusted Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="adjustedDate"
              value={adjustedDate}
              onChange={(e) => {
                setAdjustedDate(e.target.value);
                if (error && error.includes('date')) setError('');
                handleStateChange('changed');
              }}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 ${error && error.includes('date') ? 'border-red-500 ring-red-500' : ''}`}
            />
            {error && error.toLowerCase().includes('date') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div>
            <label htmlFor="resolutionNote" className="block text-sm font-medium text-gray-700">
              Resolution Note (Downstream Consequence Repair) <span className="text-red-500">*</span>
            </label>
            <textarea
              id="resolutionNote"
              rows={3}
              value={resolutionNote}
              onChange={(e) => {
                setResolutionNote(e.target.value);
                if (error && error.includes('note')) setError('');
                handleStateChange('changed');
              }}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 ${error && error.includes('note') ? 'border-red-500 ring-red-500' : ''}`}
              placeholder="Explain how downstream dependencies were handled..."
            />
             {error && error.toLowerCase().includes('note') && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {error && !error.toLowerCase().includes('date') && !error.toLowerCase().includes('note') && (
             <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
               {error}
             </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-between items-center">
        <div className="text-sm text-gray-500">
          State: <span className="font-mono bg-gray-200 px-1 rounded">{boardState}</span>
        </div>
        <button
          onClick={validateAndResolve}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <CheckCircle size={16} /> Resolve Record
        </button>
      </div>
    </div>
  );
}
