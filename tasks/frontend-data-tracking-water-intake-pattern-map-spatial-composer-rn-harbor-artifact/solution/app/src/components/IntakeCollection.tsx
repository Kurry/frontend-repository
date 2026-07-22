import React, { useState, useSyncExternalStore } from 'react';
import { store } from '../store';
import { Edit2, Archive, Trash2, PlusCircle } from 'lucide-react';
import clsx from 'clsx';
import type { IntakeEvent, IntakeStatus } from '../store';

const STATUSES: IntakeStatus[] = ['draft', 'ready', 'changed', 'archived'];

export const IntakeCollection = ({ onSelect }: { onSelect: (id: string) => void }) => {
  const state = useSyncExternalStore(store.subscribe.bind(store), () => store.state);
  const [filter, setFilter] = useState<IntakeStatus | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<IntakeEvent>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const records = filter === 'all'
    ? state.records
    : state.records.filter(r => r.status === filter);

  const validate = (data: Partial<IntakeEvent>) => {
    const newErrors: Record<string, string> = {};
    if (data.amount !== undefined && (data.amount < 0 || data.amount > 5000 || isNaN(data.amount))) {
      newErrors.amount = 'Amount must be between 0 and 5000.';
    }
    if (data.capacity !== undefined && (data.capacity < 0 || data.capacity > 100 || isNaN(data.capacity))) {
      newErrors.capacity = 'Capacity must be between 0 and 100.';
    }
    if (data.date && isNaN(Date.parse(data.date))) {
      newErrors.date = 'Must be a valid date (RFC3339).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate(formData)) return;

    if (editingId === 'new') {
      store.createEvent({
        status: formData.status as IntakeStatus || 'draft',
        amount: Number(formData.amount) || 0,
        capacity: Number(formData.capacity) || 0,
        date: formData.date || new Date().toISOString(),
        position: null,
      });
    } else if (editingId) {
      store.updateEvent(editingId, {
        status: formData.status as IntakeStatus,
        amount: Number(formData.amount),
        capacity: Number(formData.capacity),
        date: formData.date,
      });
    }
    setEditingId(null);
    setErrors({});
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Intake Events</h2>
        <button
          onClick={() => {
            setEditingId('new');
            setFormData({ status: 'draft', amount: 0, capacity: 50, date: new Date().toISOString() });
          }}
          className="p-1 text-slate-500 hover:text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none rounded"
          aria-label="Create new intake record"
        >
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="p-3 border-b border-slate-200 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={clsx("px-3 py-1 text-sm rounded-full whitespace-nowrap focus:ring-2 focus:ring-blue-500 outline-none", filter === 'all' ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
        >
          All
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={clsx("px-3 py-1 text-sm rounded-full whitespace-nowrap focus:ring-2 focus:ring-blue-500 outline-none capitalize", filter === s ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {editingId === 'new' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
            <h3 className="font-semibold text-blue-900 mb-2">New Event</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase">Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  className={clsx("mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none", errors.amount ? "border-red-500" : "border-slate-300")}
                  aria-invalid={!!errors.amount}
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1" role="alert">{errors.amount} Please correct to save.</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase">Capacity</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={e => setFormData({...formData, capacity: parseFloat(e.target.value)})}
                  className={clsx("mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none", errors.capacity ? "border-red-500" : "border-slate-300")}
                />
                {errors.capacity && <p className="text-red-500 text-xs mt-1" role="alert">{errors.capacity}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as IntakeStatus})}
                  className="mt-1 w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { setEditingId(null); setErrors({}); }} className="px-3 py-1 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
                <button onClick={handleSave} className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 outline-none">Save</button>
              </div>
            </div>
          </div>
        )}

        {records.length === 0 && editingId !== 'new' && (
          <div className="text-center p-8 text-slate-500">
            No records found. Adjust your filter or create a new event.
          </div>
        )}

        {records.map(record => (
          editingId === record.id ? (
            <div key={record.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">Amount</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    className={clsx("mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none", errors.amount ? "border-red-500" : "border-slate-300")}
                    aria-invalid={!!errors.amount}
                  />
                  {errors.amount && <p className="text-red-500 text-xs mt-1" role="alert">{errors.amount} Please correct to save.</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={e => setFormData({...formData, capacity: parseFloat(e.target.value)})}
                    className={clsx("mt-1 w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none", errors.capacity ? "border-red-500" : "border-slate-300")}
                  />
                  {errors.capacity && <p className="text-red-500 text-xs mt-1" role="alert">{errors.capacity}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as IntakeStatus})}
                    className="mt-1 w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => { setEditingId(null); setErrors({}); }} className="px-3 py-1 text-sm font-medium text-slate-600 hover:text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none">Cancel</button>
                  <button onClick={handleSave} className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 outline-none">Save</button>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={record.id}
              className="group p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm bg-white transition-all cursor-pointer flex flex-col gap-2"
              onClick={() => onSelect(record.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onSelect(record.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-500">{record.id}</span>
                <span className={clsx(
                  "px-2 py-0.5 text-xs rounded-full capitalize font-medium",
                  record.status === 'draft' ? "bg-slate-100 text-slate-700" :
                  record.status === 'ready' ? "bg-green-100 text-green-700" :
                  record.status === 'changed' ? "bg-amber-100 text-amber-700" :
                  "bg-slate-800 text-slate-200"
                )}>
                  {record.status}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xl font-light text-slate-800">{record.amount} <span className="text-sm text-slate-400 font-normal">ml</span></div>
                  <div className="text-xs text-slate-500">Cap: {record.capacity}%</div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); setFormData(record); setEditingId(record.id); }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    aria-label="Edit record"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {record.status !== 'archived' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); store.updateEvent(record.id, { status: 'archived' }); }}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded focus:ring-2 focus:ring-amber-500 outline-none"
                      aria-label="Archive record"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if(window.confirm('Are you sure you want to delete this record?')) {
                        store.deleteEvent(record.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded focus:ring-2 focus:ring-red-500 outline-none"
                    aria-label="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};
