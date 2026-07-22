import React from 'react';
import { PracticeSegment } from '../types';
import { FileText, AlertCircle, Edit, Trash, ChevronUp, ChevronDown } from 'lucide-react';

interface RecordItemProps {
  record: PracticeSegment;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectAudit: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isSelected: boolean;
}

const statusColors = {
  empty: 'bg-slate-100 text-slate-500',
  draft: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  changed: 'bg-purple-100 text-purple-700',
  archived: 'bg-gray-200 text-gray-600',
};

export const RecordItem: React.FC<RecordItemProps> = ({
  record,
  onEdit,
  onDelete,
  onSelectAudit,
  onMoveUp,
  onMoveDown,
  isSelected
}) => {
  return (
    <div
      className={`p-4 border rounded-lg mb-2 transition-all duration-300 ${isSelected ? 'border-blue-500 shadow-md ring-2 ring-blue-200' : 'border-slate-200 hover:border-slate-300'} bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 group`}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="flex flex-col gap-1">
          <button
            onClick={onMoveUp}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
            aria-label="Move up"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={onMoveDown}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
            aria-label="Move down"
          >
            <ChevronDown size={16} />
          </button>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">{record.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[record.status]}`}>
              {record.status}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {record.instrument} • {record.bpm} BPM
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {record.auditConflict && (
          <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-sm font-medium mr-2">
            <AlertCircle size={14} />
            <span>Discrepancy</span>
          </div>
        )}

        <button
          onClick={() => onSelectAudit(record.id)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            isSelected
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
          aria-label={`Audit ${record.title}`}
        >
          <FileText size={16} />
          Audit
        </button>

        <button
          onClick={() => onEdit(record.id)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded transition-colors"
          aria-label="Edit record"
        >
          <Edit size={16} />
        </button>

        <button
          onClick={() => onDelete(record.id)}
          className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
          aria-label="Delete record"
        >
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
};
