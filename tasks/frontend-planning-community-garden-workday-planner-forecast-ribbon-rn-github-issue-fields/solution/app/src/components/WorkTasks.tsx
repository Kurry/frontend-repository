import { useState } from 'react';
import { useStore } from '../store';
import type { RecordStatus, WorkRecord } from '../types';
import { Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function WorkTasks() {
    const { records, filterStatus, setFilter, selectRecord, selectedRecordId, addRecord, updateRecord, deleteRecord } = useStore();

    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const [editForm, setEditForm] = useState<Partial<WorkRecord>>({});
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const filteredRecords = records.filter(r => filterStatus === 'all' || r.status === filterStatus);

    const startEdit = (record: WorkRecord) => {
        setIsEditing(record.id);
        setEditForm(record);
        setErrorMsg(null);
    };

    const saveEdit = (id: string) => {
        if (!editForm.title || editForm.title.trim() === '') {
            setErrorMsg('Title cannot be empty');
            return;
        }
        if (editForm.effort! < 0 || editForm.effort! > 24) {
            setErrorMsg('Effort must be between 0 and 24');
            return;
        }
        updateRecord(id, editForm);
        setIsEditing(null);
        setErrorMsg(null);
    };

    const cancelEdit = () => {
        setIsEditing(null);
        setErrorMsg(null);
    };

    const startCreate = () => {
        setIsCreating(true);
        setEditForm({ title: '', status: 'draft', assignedDate: '', effort: 0 });
        setErrorMsg(null);
    };

    const saveCreate = () => {
        if (!editForm.title || editForm.title.trim() === '') {
            setErrorMsg('Title cannot be empty');
            return;
        }
        if (editForm.effort! < 0 || editForm.effort! > 24) {
            setErrorMsg('Effort must be between 0 and 24');
            return;
        }
        addRecord(editForm as Omit<WorkRecord, 'id'>);
        setIsCreating(false);
        setErrorMsg(null);
    };

    const cancelCreate = () => {
        setIsCreating(false);
        setErrorMsg(null);
    };

    return (
        <div className="flex flex-col gap-4 p-4 border border-slate-200 rounded-md bg-white shadow-sm">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Work Tasks</h2>
                <div className="flex gap-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilter(e.target.value as RecordStatus | 'all')}
                        className="px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        aria-label="Filter status"
                    >
                        <option value="all">All Statuses</option>
                        <option value="empty">Empty</option>
                        <option value="draft">Draft</option>
                        <option value="ready">Ready</option>
                        <option value="changed">Changed</option>
                        <option value="archived">Archived</option>
                    </select>
                    <button
                        onClick={startCreate}
                        disabled={isCreating}
                        className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        Add Task
                    </button>
                </div>
            </div>

            {filteredRecords.length === 0 && !isCreating && (
                <div className="text-center py-8 text-slate-500 text-sm">
                    No records found for current filter.
                </div>
            )}

            <div className="flex flex-col gap-2">
                {isCreating && (
                    <div className="border border-blue-200 bg-blue-50 p-3 rounded flex flex-col gap-2">
                        <div className="flex gap-2 flex-wrap">
                            <input
                                className="border border-slate-300 rounded px-2 py-1 text-sm flex-grow"
                                placeholder="Task title"
                                value={editForm.title || ''}
                                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                autoFocus
                            />
                            <select
                                className="border border-slate-300 rounded px-2 py-1 text-sm w-32"
                                value={editForm.status || 'draft'}
                                onChange={(e) => setEditForm({...editForm, status: e.target.value as RecordStatus})}
                            >
                                <option value="empty">Empty</option>
                                <option value="draft">Draft</option>
                                <option value="ready">Ready</option>
                                <option value="changed">Changed</option>
                                <option value="archived">Archived</option>
                            </select>
                            <input
                                type="date"
                                className="border border-slate-300 rounded px-2 py-1 text-sm w-36"
                                value={editForm.assignedDate || ''}
                                onChange={(e) => setEditForm({...editForm, assignedDate: e.target.value})}
                            />
                            <input
                                type="number"
                                className="border border-slate-300 rounded px-2 py-1 text-sm w-20"
                                placeholder="Effort"
                                min={0}
                                max={24}
                                value={editForm.effort ?? ''}
                                onChange={(e) => setEditForm({...editForm, effort: parseInt(e.target.value) || 0})}
                            />
                            <div className="flex gap-1 items-center">
                                <button onClick={saveCreate} className="p-1 text-green-600 hover:bg-green-100 rounded" aria-label="Save"><CheckCircle size={18}/></button>
                                <button onClick={cancelCreate} className="p-1 text-slate-500 hover:bg-slate-200 rounded" aria-label="Cancel"><XCircle size={18}/></button>
                            </div>
                        </div>
                        {errorMsg && <div className="text-xs text-red-600 font-medium">{errorMsg}</div>}
                    </div>
                )}

                {filteredRecords.map(record => (
                    <div
                        key={record.id}
                        className={twMerge(
                            clsx(
                                "border p-3 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors cursor-pointer",
                                selectedRecordId === record.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300 bg-white"
                            )
                        )}
                        onClick={() => selectRecord(record.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && selectRecord(record.id)}
                    >
                        {isEditing === record.id ? (
                            <div className="flex flex-col gap-2 w-full" onClick={e => e.stopPropagation()}>
                                <div className="flex gap-2 flex-wrap w-full">
                                    <input
                                        className="border border-slate-300 rounded px-2 py-1 text-sm flex-grow"
                                        placeholder="Task title"
                                        value={editForm.title || ''}
                                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                        autoFocus
                                    />
                                    <select
                                        className="border border-slate-300 rounded px-2 py-1 text-sm w-32"
                                        value={editForm.status || 'draft'}
                                        onChange={(e) => setEditForm({...editForm, status: e.target.value as RecordStatus})}
                                    >
                                        <option value="empty">Empty</option>
                                        <option value="draft">Draft</option>
                                        <option value="ready">Ready</option>
                                        <option value="changed">Changed</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                    <input
                                        type="date"
                                        className="border border-slate-300 rounded px-2 py-1 text-sm w-36"
                                        value={editForm.assignedDate || ''}
                                        onChange={(e) => setEditForm({...editForm, assignedDate: e.target.value})}
                                    />
                                    <input
                                        type="number"
                                        className="border border-slate-300 rounded px-2 py-1 text-sm w-20"
                                        placeholder="Effort"
                                        min={0}
                                        max={24}
                                        value={editForm.effort ?? ''}
                                        onChange={(e) => setEditForm({...editForm, effort: parseInt(e.target.value) || 0})}
                                    />
                                    <div className="flex gap-1 items-center">
                                        <button onClick={() => saveEdit(record.id)} className="p-1 text-green-600 hover:bg-green-100 rounded" aria-label="Save"><CheckCircle size={18}/></button>
                                        <button onClick={cancelEdit} className="p-1 text-slate-500 hover:bg-slate-200 rounded" aria-label="Cancel"><XCircle size={18}/></button>
                                    </div>
                                </div>
                                {errorMsg && <div className="text-xs text-red-600 font-medium">{errorMsg}</div>}
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-grow min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={clsx(
                                            "text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wider shrink-0",
                                            record.status === 'ready' && "bg-green-100 text-green-800",
                                            record.status === 'draft' && "bg-amber-100 text-amber-800",
                                            record.status === 'changed' && "bg-purple-100 text-purple-800",
                                            record.status === 'archived' && "bg-slate-100 text-slate-800",
                                            record.status === 'empty' && "bg-slate-100 text-slate-500 border border-slate-200"
                                        )}>
                                            {record.status}
                                        </span>
                                        <span className="text-sm font-medium text-slate-800 truncate" title={record.title}>{record.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                                        {record.assignedDate && <span>📅 {record.assignedDate}</span>}
                                        <span>⏱ {record.effort}h</span>
                                    </div>
                                </div>
                                <div className="flex gap-1 items-center" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => startEdit(record)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                        aria-label="Edit record"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteRecord(record.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        aria-label="Delete record"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
