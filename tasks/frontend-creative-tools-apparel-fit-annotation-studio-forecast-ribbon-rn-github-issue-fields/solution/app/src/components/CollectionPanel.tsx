import React, { useState } from 'react';
import { useStore, type FitAnnotation, type Status } from '../store';
import { Pencil, Trash2, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  garment: z.string().min(1, "Garment is required"),
  fitIssue: z.string().min(1, "Fit Issue is required"),
  measurementDelta: z.number().min(-50, "Min -50").max(50, "Max 50")
});

export const CollectionPanel: React.FC = () => {
  const { records, createRecord, updateRecord, deleteRecord, selectRecord, selectedRecordId } = useStore();
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredRecords = filterStatus === 'all' ? records : records.filter(r => r.status === filterStatus);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { garment: '', fitIssue: '', measurementDelta: 0 }
  });

  const onSubmit = (data: any) => {
    if (editingId) {
      updateRecord(editingId, { 'typed-fields': data });
      setEditingId(null);
    } else {
      createRecord({
        status: 'draft',
        'typed-fields': data,
        'duplicate-merge-id': null,
        'saved-query': null,
        'release-provenance': null
      });
    }
    reset();
  };

  const handleEdit = (r: FitAnnotation) => {
    setEditingId(r.id);
    reset(r['typed-fields']);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    reset({ garment: '', fitIssue: '', measurementDelta: 0 });
  };

  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-gray-50 overflow-hidden w-80 shrink-0">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold mb-2">Collection</h2>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-sm border border-gray-300 rounded p-1 w-full"
          >
            <option value="all">All Statuses</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-3 rounded shadow-sm border border-gray-200 flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{editingId ? 'Edit Annotation' : 'New Annotation'}</h3>

          <input {...register("garment")} placeholder="Garment" className="border rounded px-2 py-1 text-sm" />
          {errors.garment && <span className="text-red-500 text-xs">{errors.garment.message as string}</span>}

          <input {...register("fitIssue")} placeholder="Fit Issue" className="border rounded px-2 py-1 text-sm" />
          {errors.fitIssue && <span className="text-red-500 text-xs">{errors.fitIssue.message as string}</span>}

          <input {...register("measurementDelta", { valueAsNumber: true })} type="number" placeholder="Delta (cm)" className="border rounded px-2 py-1 text-sm" />
          {errors.measurementDelta && <span className="text-red-500 text-xs">{errors.measurementDelta.message as string}</span>}

          <div className="flex gap-2 mt-2">
            <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex-1 hover:bg-blue-700">
              {editingId ? 'Save' : 'Add'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300">
                Cancel
              </button>
            )}
          </div>
        </form>

        {filteredRecords.length === 0 ? (
          <div className="text-center text-sm text-gray-500 mt-8">No records match the current filter.</div>
        ) : (
          <div className="space-y-2">
            {filteredRecords.map(r => (
              <div
                key={r.id}
                className={`bg-white p-3 rounded shadow-sm border cursor-pointer ${selectedRecordId === r.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}
                onClick={() => selectRecord(r.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm">{r['typed-fields'].garment}</span>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(r); }} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteRecord(r.id); }} className="p-1 hover:bg-red-100 rounded text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-2">{r['typed-fields'].fitIssue}</div>
                <div className="flex justify-between items-center text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${
                    r.status === 'empty' ? 'bg-gray-100 text-gray-700' :
                    r.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    r.status === 'ready' ? 'bg-green-100 text-green-700' :
                    r.status === 'changed' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>{r.status}</span>
                  <span className="font-mono">{r['typed-fields'].measurementDelta > 0 ? '+' : ''}{r['typed-fields'].measurementDelta}cm</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
