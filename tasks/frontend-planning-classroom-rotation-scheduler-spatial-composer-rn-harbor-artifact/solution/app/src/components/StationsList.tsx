import React, { useState } from 'react';
import { useStations } from '../context/StationsContext';
import type { StationRecord, StationStatus } from '../types';
import { Edit2, Trash2, AlertCircle } from 'lucide-react';

const statusColors: Record<StationStatus, string> = {
  empty: 'bg-gray-100 text-gray-500 border-gray-200',
  draft: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  ready: 'bg-blue-50 text-blue-700 border-blue-200',
  changed: 'bg-green-50 text-green-700 border-green-200',
  archived: 'bg-gray-50 text-gray-600 border-gray-200 opacity-75'
};

export const StationsList: React.FC = () => {
  const { state, dispatch } = useStations();
  const [filter, setFilter] = useState<StationStatus | 'all'>('all');

  const filteredRecords = state.records.filter(r => filter === 'all' || r.status === filter);

  const handleAdd = () => {
    dispatch({ type: 'CREATE_RECORD', payload: { title: 'New Station', status: 'draft', capacity: 5, studentsAssigned: 0 } });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
        <h2 className="text-lg font-semibold text-gray-800">Stations Collection</h2>
        <button onClick={handleAdd} className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
          Add Station
        </button>
      </div>

      <div className="p-3 border-b border-gray-200 flex space-x-2 overflow-x-auto">
        {(['all', 'empty', 'draft', 'ready', 'changed', 'archived'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${filter === f ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p>No stations found.</p>
            <p className="text-sm">Click "Add Station" to create one.</p>
          </div>
        ) : (
          filteredRecords.map(record => (
            <StationItem key={record.id} record={record} />
          ))
        )}
      </div>
    </div>
  );
};

const StationItem: React.FC<{ record: StationRecord }> = ({ record }) => {
  const { dispatch } = useStations();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(record.title);
  const [capacity, setCapacity] = useState(record.capacity);
  const [studentsAssigned, setStudentsAssigned] = useState(record.studentsAssigned);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (capacity < 0 || studentsAssigned < 0) {
      setError('Values must be >= 0');
      return;
    }
    dispatch({
      type: 'UPDATE_RECORD',
      payload: { id: record.id, updates: { title, capacity, studentsAssigned } }
    });
    setIsEditing(false);
    setError(null);
  };

  if (isEditing) {
    return (
      <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full mb-2 p-1.5 border rounded text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          placeholder="Station Title"
        />
        <div className="flex space-x-2 mb-2">
          <label className="text-xs text-gray-600 flex-1">
            Capacity
            <input
              type="number"
              value={capacity}
              onChange={e => setCapacity(parseInt(e.target.value) || 0)}
              className="w-full mt-1 p-1 border rounded"
            />
          </label>
          <label className="text-xs text-gray-600 flex-1">
            Assigned
            <input
              type="number"
              value={studentsAssigned}
              onChange={e => setStudentsAssigned(parseInt(e.target.value) || 0)}
              className="w-full mt-1 p-1 border rounded"
            />
          </label>
        </div>
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        <div className="flex justify-end space-x-2">
          <button onClick={() => setIsEditing(false)} className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800">Cancel</button>
          <button onClick={handleSave} className="px-2 py-1 text-xs font-medium bg-primary-600 text-white rounded">Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col p-3 border border-gray-200 rounded-md bg-white hover:border-primary-300 transition-colors shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900 text-sm truncate pr-2">{record.title}</h3>
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${statusColors[record.status]}`}>
          {record.status}
        </span>
      </div>

      <div className="flex justify-between items-center mt-auto">
        <div className="text-xs text-gray-500">
          Capacity: <span className="font-semibold text-gray-700">{record.studentsAssigned} / {record.capacity}</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
          <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-primary-600" aria-label="Edit">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => dispatch({ type: 'DELETE_RECORD', payload: { id: record.id } })} className="p-1 text-gray-400 hover:text-red-600" aria-label="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
