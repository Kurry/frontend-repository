import { useState } from 'react';
import type { LessonBlock, LessonStatus } from './types';

interface Props {
  records: LessonBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (block: LessonBlock) => void;
  onUpdate: (id: string, updates: Partial<LessonBlock>) => void;
  onDelete: (id: string) => void;
}

export function LessonBlockList({ records, selectedId, onSelect, onAdd, onDelete }: Props) {
  const [filter, setFilter] = useState<LessonStatus | 'all'>('all');

  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newStatus, setNewStatus] = useState<LessonStatus>('draft');
  const [errorMsg, setErrorMsg] = useState('');

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const handleAdd = () => {
    if (!newTitle.trim()) {
      setErrorMsg('Title is required');
      return;
    }
    const dur = parseInt(newDuration, 10);
    if (isNaN(dur) || dur < 0) {
      setErrorMsg('Duration must be a positive number');
      return;
    }

    onAdd({
      id: Math.random().toString(36).substring(2, 9),
      title: newTitle.trim(),
      duration: dur,
      status: newStatus
    });
    setNewTitle('');
    setNewDuration('');
    setNewStatus('draft');
    setErrorMsg('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center bg-gray-50 p-2 rounded">
        <span className="font-semibold text-sm">Filter:</span>
        {(['all', 'empty', 'draft', 'ready', 'changed', 'archived'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-2 py-1 text-xs rounded ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded shadow border border-gray-200">
        <h3 className="font-semibold mb-2">Create Lesson Block</h3>
        {errorMsg && <p className="text-red-600 text-sm mb-2">{errorMsg}</p>}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="border p-1 text-sm rounded flex-1"
          />
          <input
            type="number"
            placeholder="Duration (min)"
            value={newDuration}
            onChange={e => setNewDuration(e.target.value)}
            className="border p-1 text-sm rounded w-24"
          />
          <select
            value={newStatus}
            onChange={e => setNewStatus(e.target.value as LessonStatus)}
            className="border p-1 text-sm rounded"
          >
            <option value="empty">empty</option>
            <option value="draft">draft</option>
            <option value="ready">ready</option>
            <option value="changed">changed</option>
            <option value="archived">archived</option>
          </select>
          <button onClick={handleAdd} className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium">Add</button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {filteredRecords.length === 0 && <div className="text-gray-500 text-sm">No blocks found.</div>}
        {filteredRecords.map(r => (
          <div
            key={r.id}
            className={`p-3 rounded border flex justify-between items-center cursor-pointer ${selectedId === r.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
            onClick={() => onSelect(r.id)}
          >
             <div>
               <h4 className="font-medium text-gray-900">{r.title}</h4>
               <p className="text-xs text-gray-500">{r.duration} min • {r.status}</p>
             </div>
             <button
                onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                className="text-red-500 text-xs px-2 py-1 bg-red-50 rounded hover:bg-red-100"
             >
               Delete
             </button>
          </div>
        ))}
      </div>
    </div>
  );
}
