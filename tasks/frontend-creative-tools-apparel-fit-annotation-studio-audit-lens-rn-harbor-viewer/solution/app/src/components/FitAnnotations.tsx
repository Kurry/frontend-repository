import { useState } from 'react';
import { useStore } from '../store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FitAnnotationSchema, DomainStatusSchema } from '../schemas';
import type { DomainStatus, FitAnnotation } from '../schemas';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

const CreateSchema = FitAnnotationSchema.omit({
  evidenceAttached: true,
  auditLensState: true,
  discrepancyResolved: true,
  id: true
});

type FormValues = z.infer<typeof CreateSchema>;

export function FitAnnotations({
  onSelectRecord
}: {
  onSelectRecord: (id: string) => void
}) {
  const { session, addRecord, updateRecord, deleteRecord } = useStore();
  const [filterStatus, setFilterStatus] = useState<DomainStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filteredRecords = session.records.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const { register, handleSubmit, reset, formState: { errors,   } } = useForm<FormValues>({
    resolver: zodResolver(CreateSchema),
    mode: 'onChange',
    defaultValues: { status: 'draft', measurement: 0, title: '' }
  });

  const onSubmit = (data: FormValues) => {
    if (editingId) {
      updateRecord(editingId, data);
      setEditingId(null);
    } else {
      const id = `rec-${Date.now()}`;
      addRecord({
        ...data,
        id,
        evidenceAttached: false,
        auditLensState: 'idle',
        discrepancyResolved: false
      });
      setIsCreating(false);
    }
    reset();
  };

  const startEdit = (record: FitAnnotation) => {
    setEditingId(record.id);
    reset({
      title: record.title,
      status: record.status,
      measurement: record.measurement
    });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    reset();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Annotations</h2>
        <button
          onClick={() => { setIsCreating(true); setEditingId(null); reset({ status: 'draft', measurement: 0, title: '' }); }}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 bg-gray-50">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as DomainStatus | 'all')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 outline-none"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          {DomainStatusSchema.options.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(isCreating || editingId) && (
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-inner">
            <h3 className="text-sm font-medium mb-3">{editingId ? 'Edit Record' : 'New Record'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                <input {...register('title')} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select {...register('status')} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md">
                    {DomainStatusSchema.options.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Measurement</label>
                  <input type="number" {...register('measurement', { valueAsNumber: true })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md" />
                  {errors.measurement && <p className="text-red-500 text-xs mt-1">{errors.measurement.message}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
                <button type="button" onClick={cancelEdit} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                <button type="submit"  className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md disabled:opacity-50">
                  Save
                </button>
              </div>
            </div>
          </form>
        )}

        {filteredRecords.length === 0 && !isCreating && !editingId && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No records found. Try adjusting filters or create a new one.
          </div>
        )}

        <div className="space-y-2">
          {filteredRecords.map(record => (
            <div
              key={record.id}
              className={`p-3 border rounded-lg hover:border-gray-400 transition-colors cursor-pointer flex items-center justify-between group ${
                record.id === editingId ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 bg-white'
              }`}
              onClick={() => onSelectRecord(record.id)}
              data-testid={`record-${record.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{record.title}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${
                    record.status === 'ready' ? 'bg-green-100 text-green-800' :
                    record.status === 'archived' ? 'bg-gray-100 text-gray-600' :
                    record.status === 'empty' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {record.status}
                  </span>
                  {record.auditLensState === 'conflict' && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-800">
                      Conflict
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Measure: {record.measurement} | ID: {record.id}
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => startEdit(record)}
                  className="p-1.5 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100"
                  aria-label={`Edit ${record.title}`}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this record?')) deleteRecord(record.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                  aria-label={`Delete ${record.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
