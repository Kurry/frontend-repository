import type { BookRecord } from '../types';
import type { Action } from '../store';
import { X, ShieldAlert, GitCommit, GitBranch } from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';

interface ProvenanceAtlasProps {
  book: BookRecord;
  onClose: () => void;
  dispatch: React.Dispatch<Action>;
}

export function ProvenanceAtlas({ book, onClose, dispatch }: ProvenanceAtlasProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus management for accessibility
    panelRef.current?.focus();
  }, [book.id]);

  const handleQuarantine = () => {
    dispatch({ type: 'QUARANTINE_LINEAGE', payload: { id: book.id } });
  };

  const handleStatusChange = (status: any) => {
    dispatch({ type: 'CHANGE_STATUS', payload: { id: book.id, status, description: `Manually changed status to ${status}` } });
  };

  return (
    <div
      className="flex flex-col h-full bg-slate-50 border-l border-slate-200 outline-none"
      tabIndex={-1}
      ref={panelRef}
      role="region"
      aria-label="Provenance Atlas"
    >
      <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <GitBranch size={18} className="text-blue-500" />
          Provenance Atlas
        </h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded text-slate-500"
          aria-label="Close panel"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 bg-white border-b border-slate-200">
        <h3 className="font-bold text-slate-900 text-lg mb-1">{book.title}</h3>
        <p className="text-sm text-slate-500 mb-4">by {book.author}</p>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Current State:</span>
          <span className={clsx(
            "px-2 py-1 text-xs rounded font-medium border",
            book.status === 'quarantined' ? "bg-red-100 text-red-800 border-red-200" : "bg-slate-100 text-slate-700 border-slate-200"
          )}>
            {book.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {book.status !== 'quarantined' && (
            <button
              onClick={handleQuarantine}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-sm font-medium transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none"
              aria-live="polite"
            >
              <ShieldAlert size={16} />
              Quarantine Bad Lineage
            </button>
          )}

          <select
            value={book.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded text-sm bg-white"
          >
            <option value="draft">Set to Draft</option>
            <option value="ready">Set to Ready</option>
            <option value="changed">Set to Changed</option>
            <option value="archived">Set to Archived</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <GitCommit size={14} /> Lineage History
        </h4>

        <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
          {book.history.map((event, index) => (
            <div key={event.id} className="relative pl-6">
              <div className={clsx(
                "absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white",
                event.type === 'quarantined' ? "bg-red-500" :
                index === book.history.length - 1 ? "bg-blue-500" : "bg-slate-400"
              )} />
              <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-slate-900 capitalize flex items-center gap-1">
                    {event.type.replace('_', ' ')}
                    {event.type === 'quarantined' && <ShieldAlert size={14} className="text-red-500" />}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{event.description}</p>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  {event.id}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
