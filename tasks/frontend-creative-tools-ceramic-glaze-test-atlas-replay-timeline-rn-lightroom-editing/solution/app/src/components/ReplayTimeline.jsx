import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { AlertCircle, History, Edit2, Archive, Trash2 } from 'lucide-react';

export default function ReplayTimeline() {
  const { state, dispatch } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const record = state.records.find(r => r.id === state.selectedId);

  useEffect(() => {
    if (record) {
      setEditName(record.name);
      setIsEditing(false);
      setErrorMsg("");
    }
  }, [record?.id]);

  if (!record) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
        <History size={48} className="mb-4 opacity-20" />
        <p>Select a glaze test to view its timeline</p>
      </div>
    );
  }

  const handleSaveName = () => {
    if (!editName.trim()) {
      setErrorMsg("Name cannot be empty");
      return;
    }
    dispatch({ type: 'UPDATE_RECORD', payload: { ...record, name: editName } });
    setIsEditing(false);
    setErrorMsg("");
  };

  const handleStatusChange = (newStatus) => {
    const updated = {
      ...record,
      status: newStatus,
      history: [...record.history, { timestamp: new Date().toISOString(), status: newStatus }]
    };
    dispatch({ type: 'UPDATE_RECORD', payload: updated });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this test?")) {
      dispatch({ type: 'DELETE_RECORD', payload: record });
    }
  };

  const handleRestore = (timestamp) => {
    dispatch({ type: 'RESTORE_CHECKPOINT', payload: { id: record.id, timestamp } });
  };

  const activeIndex = record.history.length - 1;

  const getStatusColor = (status) => {
    switch(status) {
      case 'ready': return 'bg-emerald-500';
      case 'changed': return 'bg-amber-500';
      case 'archived': return 'bg-slate-400';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-white">
        <div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="text-xl font-bold border-b border-slate-300 focus:border-amber-500 outline-none px-1 py-0.5"
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              />
              <button onClick={handleSaveName} className="text-sm bg-amber-600 text-white px-2 py-1 rounded">Save</button>
              <button onClick={() => setIsEditing(false)} className="text-sm text-slate-500 px-2">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{record.name}</h2>
              <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-slate-600">
                <Edit2 size={16} />
              </button>
            </div>
          )}
          {errorMsg && <div aria-live="polite" className="text-red-500 text-sm mt-1">{errorMsg}</div>}

          <div className="flex items-center gap-2 mt-4">
            {['draft', 'ready', 'changed', 'archived'].map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={record.status === s}
                className={`px-3 py-1 text-xs font-medium uppercase tracking-wider rounded-full border ${
                  record.status === s
                    ? `border-transparent text-white ${getStatusColor(s)}`
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleDelete} className="text-slate-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50">
          <Trash2 size={20} />
        </button>
      </div>

      <div className="p-8 bg-slate-50 flex-1 overflow-x-auto">
        <h3 className="text-sm font-medium text-slate-500 mb-8">Replay Timeline</h3>

        <div className="relative pt-8 pb-4 min-w-[600px]">
          {/* Base line */}
          <div className="absolute top-10 left-4 right-4 h-1 bg-slate-200 rounded-full" />

          <div className="relative flex justify-between px-4">
            <AnimatePresence>
              {record.history.map((event, idx) => {
                const isActive = idx === activeIndex;
                const isPast = idx < activeIndex;

                return (
                  <div key={event.timestamp} className="relative flex flex-col items-center group w-24">
                    <motion.div
                      layout={!prefersReducedMotion}
                      initial={!prefersReducedMotion ? { scale: 0, opacity: 0 } : {}}
                      animate={!prefersReducedMotion ? { scale: 1, opacity: 1 } : {}}
                      className="absolute -top-3 flex flex-col items-center z-10"
                    >
                      <button
                        onClick={() => !isActive && handleRestore(event.timestamp)}
                        disabled={isActive}
                        className={`w-6 h-6 rounded-full border-2 bg-white transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${
                          isActive
                            ? `border-4 ${getStatusColor(event.status).replace('bg-', 'border-')} w-8 h-8 -top-1 relative`
                            : isPast
                              ? 'border-slate-400 hover:border-amber-400 cursor-pointer'
                              : 'border-slate-200'
                        }`}
                        aria-label={`Restore to ${event.status} state from ${format(new Date(event.timestamp), 'MMM d, h:mm a')}`}
                      />
                      {!isActive && (
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-20">
                          Restore Checkpoint
                        </div>
                      )}
                    </motion.div>

                    <div className="mt-8 text-center">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {event.status}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 whitespace-nowrap">
                        {format(new Date(event.timestamp), 'h:mm:ss a')}
                      </div>
                      <div className="text-[10px] text-slate-400 whitespace-nowrap">
                        {format(new Date(event.timestamp), 'MMM d, yyyy')}
                      </div>
                      {event.note && (
                        <div className="text-[10px] text-amber-600 mt-1 flex items-center justify-center gap-1">
                          <AlertCircle size={10} /> {event.note}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
