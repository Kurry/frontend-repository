import { useState } from 'react';
import type { TaskStatus } from '../hooks/useRestockState';
import { useRestockState } from '../hooks/useRestockState';
import { Pencil, Trash2, Plus, ArrowRight, Save, X } from 'lucide-react';

export function RestockTasks() {
  const { state, addTask, updateTask, deleteTask, setAuditRecordId } = useRestockState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');

  const filteredTasks = state.records.filter(
    task => filterStatus === 'ALL' || task.status === filterStatus
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Restock Tasks</h2>
        <div className="flex gap-2 items-center">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border p-1 rounded text-sm bg-white"
          >
            <option value="ALL">All</option>
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="CHANGED">Changed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button
            onClick={() => {
              try {
                addTask({
                  title: 'New Task',
                  location: 'Main Fridge',
                  quantity: 1,
                  maxLimit: 10,
                  status: 'DRAFT'
                });
              } catch (e: any) {
                alert(e.message);
              }
            }}
            className="bg-primary text-white p-1 rounded hover:bg-blue-600 flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {filteredTasks.length === 0 ? (
          <div className="text-muted text-center p-4 border rounded">No tasks found.</div>
        ) : (
          filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              allRecords={state.records}
              isEditing={editingId === task.id}
              setEditing={(v: boolean) => setEditingId(v ? task.id : null)}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onAudit={() => setAuditRecordId(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TaskItem({ task, allRecords, isEditing, setEditing, onUpdate, onDelete, onAudit }: any) {
  const [editState, setEditState] = useState(task);
  const [error, setError] = useState('');

  if (isEditing) {
    return (
      <div className="border p-3 rounded shadow-sm bg-white flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            value={editState.title}
            onChange={e => setEditState({...editState, title: e.target.value})}
            className="border p-1 rounded font-bold"
            placeholder="Title (Required)"
          />
          <input
            value={editState.location}
            onChange={e => setEditState({...editState, location: e.target.value})}
            className="border p-1 rounded text-sm"
            placeholder="Location"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs w-16">Qty:</span>
            <input
              type="number"
              value={editState.quantity}
              onChange={e => setEditState({...editState, quantity: Number(e.target.value)})}
              className="border p-1 rounded text-sm w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs w-16">Limit:</span>
            <input
              type="number"
              value={editState.maxLimit}
              onChange={e => setEditState({...editState, maxLimit: Number(e.target.value)})}
              className="border p-1 rounded text-sm w-full"
            />
          </div>

          <select
            value={editState.status}
            onChange={e => setEditState({...editState, status: e.target.value})}
            className="border p-1 rounded text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="CHANGED">Changed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            value={editState.dependentRecordId || ""}
            onChange={e => setEditState({...editState, dependentRecordId: e.target.value || undefined})}
            className="border p-1 rounded text-sm"
          >
            <option value="">No Dependency</option>
            {allRecords.map((r: any) => r.id !== task.id && (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>
        {error && <div className="text-error text-xs">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="text-muted p-1 hover:bg-gray-100 rounded">
            <X size={16} />
          </button>
          <button
            onClick={() => {
              setError('');
              try {
                onUpdate(task.id, editState);
                setEditing(false);
              } catch (err: any) {
                setError(err.message);
              }
            }}
            className="text-success p-1 hover:bg-gray-100 rounded"
          >
            <Save size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="border p-3 rounded shadow-sm bg-white flex flex-col gap-2 group transition-all"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold">{task.title}</h3>
          <div className="text-xs text-muted flex gap-2">
            <span>{task.location}</span>
            <span>•</span>
            <span>Qty: {task.quantity}/{task.maxLimit}</span>
            <span>•</span>
            <span className="font-semibold text-primary">{task.status}</span>
          </div>
          {task.dependentRecordId && (
            <div className="text-xs text-warning mt-1">Depends on: {task.dependentRecordId}</div>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="p-1 hover:bg-gray-100 rounded text-muted">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1 hover:bg-gray-100 rounded text-error">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end mt-2">
        <div className="text-xs text-muted">
          {task.auditLensState ? (
            <span className="text-success flex items-center gap-1">Audit: {task.auditLensState.status}</span>
          ) : 'No audit evidence'}
        </div>
        <button
          onClick={onAudit}
          className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1 hover:bg-primary hover:text-white transition-colors"
        >
          Audit Lens <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
