import { useState } from 'react';
import { useStore } from './store';
import { Wrench, CheckCircle2, AlertCircle, FileText, Activity, Plus, Edit2 } from 'lucide-react';
import { RecordForm } from './RecordForm';

export function RecordList() {
  const { state, selectRecord, deleteRecord } = useStore();
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filteredRecords = state.records.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'discrepancy') return r.auditDiscrepancy;
    return r.status === filter;
  });

  const getStatusIcon = (status, hasDiscrepancy) => {
    if (hasDiscrepancy) return <AlertCircle className="w-5 h-5 text-red-500" />;
    switch(status) {
      case 'ready': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'changed': return <Activity className="w-5 h-5 text-blue-500" />;
      default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const openNewRecord = () => {
    setEditingId(null);
    setIsFormOpen(true);
  };

  const openEditRecord = (e, id) => {
    e.stopPropagation();
    setEditingId(id);
    setIsFormOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col relative">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center rounded-t-lg">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Service Records
        </h2>
        <div className="flex items-center gap-2">
            <select
              className="bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter records"
            >
              <option value="all">All Records</option>
              <option value="discrepancy">Needs Audit</option>
              <option value="draft">Drafts</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
            </select>
            <button
                onClick={openNewRecord}
                className="bg-primary-600 text-white p-1 rounded hover:bg-primary-700 transition-colors"
                aria-label="New Record"
            >
                <Plus className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3" role="list">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500 empty-state">
            No records match the current filter.
          </div>
        ) : (
          filteredRecords.map(record => {
            const isSelected = state.auditLensState.selectedRecordId === record.id;

            return (
              <div
                key={record.id}
                role="listitem"
                tabIndex={0}
                className={`
                  p-4 rounded-lg border transition-all cursor-pointer group
                  ${isSelected
                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500 shadow-sm'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}
                  ${record.auditDiscrepancy && !isSelected ? 'border-red-200 bg-red-50' : ''}
                `}
                onClick={() => selectRecord(record.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectRecord(record.id);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getStatusIcon(record.status, record.auditDiscrepancy)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{record.title}</h3>
                      <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>{record.date}</span>
                        <span>{record.mileage} miles</span>
                        <span className={`capitalize font-medium ${record.auditDiscrepancy ? 'text-red-600' : 'text-gray-600'}`}>
                          Status: {record.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity focus-within:opacity-100">
                      <button
                        onClick={(e) => openEditRecord(e, record.id)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        aria-label={`Edit ${record.title}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRecord(record.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label={`Delete ${record.title}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isFormOpen && (
          <RecordForm recordId={editingId} onClose={() => setIsFormOpen(false)} />
      )}
    </div>
  );
}
