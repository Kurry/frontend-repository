import { useState } from 'react';
import { useStore } from '../store';
import { LayoverActivity, DomainStatus } from '../types';
import { LayoverActivitySchema } from '../schema';

export function LayoverList() {
  const { records, addRecord, updateRecord, deleteRecord, selectRecord, selectedId } = useStore();
  const [filter, setFilter] = useState<DomainStatus | 'all'>('all');

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LayoverActivity>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const handleEdit = (record: LayoverActivity) => {
    setIsEditing(record.id);
    setEditForm(record);
    setErrors({});
  };

  const handleSave = () => {
    if (!isEditing) return;

    const result = LayoverActivitySchema.safeParse(editForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        if (issue.path.length > 0) {
           fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    updateRecord(isEditing, result.data);
    setIsEditing(null);
    setErrors({});
  };

  const handleCancel = () => {
    setIsEditing(null);
    setErrors({});
  };

  const handleCreate = () => {
    addRecord({
      title: 'New Activity',
      status: 'draft',
      durationMinutes: 60,
      location: 'Terminal 1'
    });
  };

  const getStatusColor = (status: DomainStatus) => {
    switch(status) {
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'resolved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white shadow rounded-lg overflow-hidden border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Layover Activities</h2>
        <div className="flex gap-2 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            aria-label="Filter activities"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="failed">Failed</option>
            <option value="resolved">Resolved</option>
          </select>
          <button
            onClick={handleCreate}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Activity
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3" role="list">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No activities found.</div>
        ) : (
          filteredRecords.map(record => (
            <div
              key={record.id}
              role="listitem"
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedId === record.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
              } ${isEditing === record.id ? 'bg-blue-50' : 'bg-white'}`}
              onClick={() => {
                if (isEditing !== record.id) selectRecord(record.id);
              }}
              tabIndex={0}
              onKeyDown={(e) => {
                 if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (isEditing !== record.id) selectRecord(record.id);
                 }
              }}
            >
              {isEditing === record.id ? (
                <div className="space-y-3" onClick={e => e.stopPropagation()}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={e => {
                        setEditForm({...editForm, title: e.target.value});
                        if (errors.title) setErrors({...errors, title: ''});
                      }}
                      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Duration (mins)</label>
                      <input
                        type="number"
                        value={editForm.durationMinutes || ''}
                        onChange={e => {
                          setEditForm({...editForm, durationMinutes: parseInt(e.target.value)});
                          if (errors.durationMinutes) setErrors({...errors, durationMinutes: ''});
                        }}
                        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.durationMinutes ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                      />
                      {errors.durationMinutes && <p className="mt-1 text-sm text-red-600">{errors.durationMinutes}</p>}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <input
                        type="text"
                        value={editForm.location || ''}
                        onChange={e => {
                          setEditForm({...editForm, location: e.target.value});
                          if (errors.location) setErrors({...errors, location: ''});
                        }}
                        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.location ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                      />
                      {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={editForm.status || 'draft'}
                      onChange={e => setEditForm({...editForm, status: e.target.value as DomainStatus})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="failed">Failed</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
                    <button onClick={handleCancel} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                    <button onClick={handleSave} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">Save</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{record.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span>⏱ {record.durationMinutes} mins</span>
                      <span>•</span>
                      <span>📍 {record.location}</span>
                    </p>
                    {record.status === 'failed' && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <span className="font-semibold">Impact:</span> {record.downstreamImpact || 'Unknown downstream impact'}
                      </p>
                    )}
                     {record.status === 'resolved' && record.recoveryPathId && (
                      <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                        <span className="font-semibold">Recovery Path:</span> {record.recoveryPathId} | {record.downstreamImpact}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
