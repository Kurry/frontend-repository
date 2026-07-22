import type { BookRecord, BookStatus } from '../types';
import { clsx } from 'clsx';
import { Book, AlertTriangle, CheckCircle, Clock, Archive } from 'lucide-react';

interface BookCardProps {
  book: BookRecord;
  isSelected: boolean;
  onSelect: () => void;
}

const statusConfig: Record<BookStatus, { color: string; icon: React.ReactNode; label: string }> = {
  draft: { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: <Clock size={14} />, label: 'Draft' },
  ready: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle size={14} />, label: 'Ready' },
  changed: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Book size={14} />, label: 'Changed' },
  archived: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Archive size={14} />, label: 'Archived' },
  quarantined: { color: 'bg-red-50 text-red-700 border-red-200', icon: <AlertTriangle size={14} />, label: 'Quarantined' },
};

export function BookCard({ book, isSelected, onSelect }: BookCardProps) {
  const config = statusConfig[book.status];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      className={clsx(
        "p-4 border rounded-lg transition-all text-left group cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500",
        isSelected ? "border-blue-500 shadow-md ring-1 ring-blue-500" : "border-slate-200 hover:border-slate-300 bg-white"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {book.title}
        </h3>
        <span className={clsx("flex items-center gap-1 text-xs px-2 py-1 rounded-full border", config.color)}>
          {config.icon}
          {config.label}
        </span>
      </div>
      <p className="text-sm text-slate-500 mb-4">{book.author}</p>

      <div className="text-xs text-slate-400 flex items-center justify-between">
        <span>ID: {book.id.slice(0, 8)}...</span>
        <span>Events: {book.history.length}</span>
      </div>
    </div>
  );
}
