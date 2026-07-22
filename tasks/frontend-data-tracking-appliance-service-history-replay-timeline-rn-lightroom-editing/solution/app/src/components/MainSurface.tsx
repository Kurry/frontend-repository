import React, { useState } from 'react';
import { useStore } from '../store';
import { cn } from '../utils';
import { Filter, SortAsc, SortDesc, Plus, Trash2, Archive, Pencil } from 'lucide-react';
import type { ApplianceStatus } from '../types';
import RecordForm from './RecordForm';
import { motion, AnimatePresence } from 'framer-motion';

export default function MainSurface() {
  const { records, derived, setFilter, setSortOrder, selectRecord, deleteRecord, archiveRecord } = useStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const statuses: (ApplianceStatus | 'all')[] = ['all', 'empty', 'draft', 'ready', 'changed', 'archived'];

  let displayedRecords = records.filter(r => derived.activeFilter === 'all' || r.status === derived.activeFilter);

  if (derived.sortOrder === 'asc') {
    displayedRecords.sort((a, b) => a.brand.localeCompare(b.brand));
  } else {
    displayedRecords.sort((a, b) => b.brand.localeCompare(a.brand));
  }

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEditingRecordId(id);
    setIsFormOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteRecord(id);
  };

  const handleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    archiveRecord(id);
  };

  const getStatusColor = (status: ApplianceStatus) => {
    switch (status) {
      case 'ready': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'draft': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'changed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'empty': return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-xl font-semibold text-slate-800">Appliance Records</h2>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <Filter className="w-4 h-4 ml-2 text-slate-500" />
            <select
              className="px-2 py-1.5 text-sm bg-transparent outline-none focus:ring-0"
              value={derived.activeFilter}
              onChange={(e) => setFilter(e.target.value as ApplianceStatus | 'all')}
              aria-label="Filter by status"
            >
              {statuses.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setSortOrder(derived.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50"
            aria-label="Toggle sort order"
          >
            {derived.sortOrder === 'asc' ? <SortAsc className="w-5 h-5 text-slate-600" /> : <SortDesc className="w-5 h-5 text-slate-600" />}
          </button>

          <button
            onClick={() => { setEditingRecordId(null); setIsFormOpen(true); }}
            className="ml-auto sm:ml-2 flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-md shadow-sm hover:bg-indigo-700 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 rounded-xl border border-slate-200 shadow-inner p-4 relative">
        {displayedRecords.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <Filter className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-lg font-medium text-slate-600">No records found</p>
            <p className="text-sm">Try changing your filters or add a new record.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
            {displayedRecords.map(record => (
              <motion.li
                key={record.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => selectRecord(record.id)}
                className={cn(
                  "bg-white rounded-lg border shadow-sm p-4 cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  derived.activeSelectionId === record.id ? "border-indigo-500 ring-1 ring-indigo-500" : "border-slate-200 hover:border-slate-300"
                )}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectRecord(record.id);
                  }
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider", getStatusColor(record.status))}>
                    {record.status}
                  </span>

                  <div className="flex gap-1">
                    <button
                      onClick={(e) => handleEdit(e, record.id)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      aria-label={`Edit ${record.brand} ${record.type}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {record.status !== 'archived' && (
                      <button
                        onClick={(e) => handleArchive(e, record.id)}
                        className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                        aria-label={`Archive ${record.brand} ${record.type}`}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        if (window.confirm("Are you sure you want to delete this record?")) {
                          handleDelete(e, record.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      aria-label={`Delete ${record.brand} ${record.type}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 leading-tight">
                  {record.brand} {record.model}
                </h3>
                <p className="text-slate-500 text-sm mb-3">{record.type}</p>

                <div className="flex justify-between items-end">
                  <div className="text-xs text-slate-400">
                    <span className="block">SN: {record.serial_number || 'N/A'}</span>
                    <span className="block mt-0.5">Events: {record.service_history.length}</span>
                  </div>
                </div>
              </motion.li>
            ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <RecordForm
            recordId={editingRecordId}
            onClose={() => { setIsFormOpen(false); setEditingRecordId(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
