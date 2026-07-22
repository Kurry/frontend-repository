
import { useDerivedSummary } from '../store';
import { Users, Clock, Target, CheckSquare, ListOrdered } from 'lucide-react';

export function DerivedSummaryPanel() {
  const summary = useDerivedSummary();

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Derived Summary</h3>
      <div className="grid grid-cols-5 gap-4">

        <div className="flex flex-col">
          <span className="text-gray-400 flex items-center gap-1 text-xs mb-1">
            <ListOrdered size={14} /> Checkpoints
          </span>
          <span className="text-xl font-semibold text-gray-800">{summary.total_checkpoints}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-gray-400 flex items-center gap-1 text-xs mb-1">
            <Users size={14} /> Total Headcount
          </span>
          <span className="text-xl font-semibold text-gray-800">{summary.total_headcount}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-gray-400 flex items-center gap-1 text-xs mb-1">
            <Clock size={14} /> Max Predicted
          </span>
          <span className="text-xl font-semibold text-gray-800">{summary.max_predicted_time}m</span>
        </div>

        <div className="flex flex-col">
          <span className="text-gray-400 flex items-center gap-1 text-xs mb-1">
            <Target size={14} /> Avg Target
          </span>
          <span className="text-xl font-semibold text-gray-800">{summary.avg_target_time.toFixed(1)}m</span>
        </div>

        <div className="flex flex-col">
          <span className="text-gray-400 flex items-center gap-1 text-xs mb-1">
            <CheckSquare size={14} /> Ready Status
          </span>
          <span className="text-xl font-semibold text-green-600">{summary.ready_count}</span>
        </div>

      </div>
    </div>
  );
}
