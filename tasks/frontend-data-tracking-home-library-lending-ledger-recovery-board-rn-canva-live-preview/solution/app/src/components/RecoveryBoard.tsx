import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { BookRecord } from '../types';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const RecoveryBoard: React.FC = () => {
  const { state, dispatch } = useStore();

  const recoveryRecords = state.records.filter(r => r.status === 'recovery');
  const selectedRecord = state.records.find(r => r.id === state.selectedRecordId);

  // The active recovery item is either the selected one if it's in recovery, or just the first one.
  const activeRecord = (selectedRecord?.status === 'recovery')
    ? selectedRecord
    : (recoveryRecords.length > 0 ? recoveryRecords[0] : null);

  const [editForm, setEditForm] = useState<Partial<BookRecord>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeRecord) {
      setEditForm(activeRecord);
      setErrorMsg(null);
    }
  }, [activeRecord]);

  const handleResolve = () => {
    setErrorMsg(null);
    if (!editForm.isbn || editForm.isbn.trim() === '') {
      setErrorMsg('ISBN is required to resolve.');
      return;
    }
    if (editForm.pageCount === undefined || editForm.pageCount <= 0) {
      setErrorMsg('Valid page count is required.');
      return;
    }
    if (!editForm.title || editForm.title.trim() === '') {
      setErrorMsg('Title cannot be empty.');
      return;
    }

    if (activeRecord) {
      dispatch({
        type: 'RESOLVE_RECOVERY',
        payload: {
          ...activeRecord,
          ...editForm,
        } as BookRecord
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full h-full" data-testid="recovery-board">

      {/* Left Column: Summary / Queue */}
      <div className="md:w-1/3 bg-gray-50 border-r p-4 flex flex-col gap-4 rounded shadow">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle className="text-orange-500" />
          Recovery Queue ({recoveryRecords.length})
        </h2>

        {recoveryRecords.length === 0 ? (
          <div className="p-4 bg-green-50 text-green-800 rounded flex items-center gap-2">
            <CheckCircle size={20} />
            <span>All clear. No records in recovery.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto">
            {recoveryRecords.map(record => (
              <div
                key={record.id}
                role="button"
                tabIndex={0}
                className={`p-3 border rounded cursor-pointer transition-all duration-200
                  ${activeRecord?.id === record.id ? 'bg-white border-orange-400 shadow-md transform scale-[1.02]' : 'bg-white border-gray-200 hover:border-orange-300'}`}
                onClick={() => dispatch({ type: 'SELECT_RECORD', payload: record.id })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    dispatch({ type: 'SELECT_RECORD', payload: record.id });
                  }
                }}
              >
                <div className="font-bold">{record.title}</div>
                <div className="text-sm text-gray-600">{record.author}</div>
                <div className="text-xs text-orange-600 mt-1 bg-orange-50 p-1 inline-block rounded">
                  Reason: {record.recoveryReason || 'Needs review'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Resolution Panel */}
      <div className="md:w-2/3 p-4 bg-white rounded shadow flex flex-col">
        {activeRecord ? (
          <div className="flex flex-col h-full animate-fade-in">
            <h2 className="text-2xl font-bold mb-2">Resolve Record</h2>
            <div className="bg-orange-50 text-orange-800 p-3 rounded mb-6 flex gap-2 items-start">
              <Info className="mt-0.5" size={20} />
              <div>
                <p className="font-semibold">Attention Required</p>
                <p className="text-sm">{activeRecord.recoveryReason || 'Please verify the details below and provide any missing information.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
              <div>
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                  value={editForm.title || ''}
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                  aria-label="Title"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Author</label>
                <input
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                  value={editForm.author || ''}
                  onChange={e => setEditForm({...editForm, author: e.target.value})}
                  aria-label="Author"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-red-600">ISBN (Required)</label>
                <input
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 font-mono"
                  value={editForm.isbn || ''}
                  onChange={e => setEditForm({...editForm, isbn: e.target.value})}
                  placeholder="e.g. 978-3-16-148410-0"
                  aria-label="ISBN"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-red-600">Pages (Required &gt; 0)</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                  value={editForm.pageCount || ''}
                  onChange={e => setEditForm({...editForm, pageCount: parseInt(e.target.value) || 0})}
                  aria-label="Page Count"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Resolution Notes</label>
                <textarea
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 h-24"
                  value={editForm.recoveryNote || ''}
                  onChange={e => setEditForm({...editForm, recoveryNote: e.target.value})}
                  placeholder="Notes on how this was resolved..."
                  aria-label="Resolution Notes"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-100 text-red-800 rounded border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-4 border-t pt-4">
              <button
                className="px-6 py-2 border rounded hover:bg-gray-100 focus:ring-2 focus:ring-gray-400"
                onClick={() => dispatch({ type: 'SELECT_RECORD', payload: null })}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors"
                onClick={handleResolve}
              >
                Commit Resolution
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <CheckCircle size={48} className="mb-4 text-green-200" />
            <p className="text-lg">Select a record from the queue to resolve it.</p>
          </div>
        )}
      </div>
    </div>
  );
};
