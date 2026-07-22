import React, { useState } from 'react';
import type { LessonBlock, DomainStatus } from './types';

interface LessonBlockListProps {
  records: LessonBlock[];
  createRecord: (r: { title: string; durationMins: number }) => void;
  updateRecord: (id: string, updates: Partial<LessonBlock>) => void;
  archiveRecord: (id: string) => void;
  onSelectForAudit: (id: string) => void;
  selectedId: string | null;
}

export const LessonBlockList: React.FC<LessonBlockListProps> = ({
  records,
  createRecord,
  updateRecord,
  archiveRecord,
  onSelectForAudit,
  selectedId
}) => {
  const [filter, setFilter] = useState<DomainStatus | 'all'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(45);

  const filtered = filter === 'all' ? records : records.filter(r => r.status === filter);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newDuration <= 0) return;
    createRecord({ title: newTitle, durationMins: newDuration });
    setNewTitle('');
    setNewDuration(45);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-800">Lesson Blocks</h2>
        <select
          className="px-3 py-1.5 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          aria-label="Filter records"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
        <input
          className="flex-1 px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="New lesson title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          required
        />
        <input
          className="w-24 px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="number"
          value={newDuration}
          onChange={(e) => setNewDuration(parseInt(e.target.value) || 0)}
          min="1"
          required
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors">
          Add
        </button>
      </form>

      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-white border border-slate-200 border-dashed rounded-lg text-slate-500">
          No lesson blocks found. Create one to get started.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(record => (
            <div
              key={record.id}
              className={`p-4 bg-white border rounded-lg shadow-sm transition-all duration-300 ease-in-out ${
                selectedId === record.id
                  ? 'border-blue-500 ring-1 ring-blue-500'
                  : 'border-slate-200 hover:border-slate-300'
              } ${record.status === 'archived' ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      value={record.title}
                      onChange={(e) => updateRecord(record.id, { title: e.target.value })}
                      className="font-medium text-slate-800 bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none px-1 py-0.5 w-full sm:w-auto"
                      aria-label="Edit title"
                    />
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      record.status === 'draft' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                      record.status === 'ready' ? 'bg-green-100 text-green-700 border-green-200' :
                      record.status === 'changed' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {record.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      record.auditState === 'resolved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      record.auditState === 'conflict' ? 'bg-red-100 text-red-700 border-red-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {record.auditState}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 px-1">
                    {record.durationMins} mins
                    {record.evidenceId && ` • Evidence: ${record.evidenceId}`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectForAudit(record.id)}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-transparent rounded transition-colors"
                  >
                    Audit
                  </button>
                  <button
                    onClick={() => archiveRecord(record.id)}
                    disabled={record.status === 'archived'}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded transition-colors disabled:opacity-50"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
