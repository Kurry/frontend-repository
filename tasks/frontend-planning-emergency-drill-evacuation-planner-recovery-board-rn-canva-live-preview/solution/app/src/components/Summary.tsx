import { useStore, getDerivedState } from '../store';
import { Activity, Archive, CheckCircle2, FileEdit } from 'lucide-react';
import { motion } from 'motion/react';

export function Summary() {
  const { records } = useStore();
  const derived = getDerivedState(records);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Activity size={16} />
        Live Summary
      </h3>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 flex flex-col items-center justify-center text-center">
          <FileEdit className="text-amber-500 mb-1" size={20} />
          <motion.div
            key={derived.totalDrafts}
            initial={{ scale: 1.2, color: '#f59e0b' }}
            animate={{ scale: 1, color: '#b45309' }}
            className="text-2xl font-bold text-amber-700"
          >
            {derived.totalDrafts}
          </motion.div>
          <div className="text-xs font-medium text-amber-600 mt-1">Drafts</div>
        </div>

        <div className="bg-green-50 rounded-lg p-3 border border-green-100 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="text-green-500 mb-1" size={20} />
          <motion.div
            key={derived.totalReady}
            initial={{ scale: 1.2, color: '#10b981' }}
            animate={{ scale: 1, color: '#047857' }}
            className="text-2xl font-bold text-green-700"
          >
            {derived.totalReady}
          </motion.div>
          <div className="text-xs font-medium text-green-600 mt-1">Ready</div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex flex-col items-center justify-center text-center">
          <Archive className="text-slate-400 mb-1" size={20} />
          <motion.div
            key={derived.totalArchived}
            initial={{ scale: 1.2, color: '#64748b' }}
            animate={{ scale: 1, color: '#334155' }}
            className="text-2xl font-bold text-slate-700"
          >
            {derived.totalArchived}
          </motion.div>
          <div className="text-xs font-medium text-slate-500 mt-1">Archived</div>
        </div>
      </div>

      <div className="bg-slate-100 rounded px-3 py-2 text-xs font-mono text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap">
        {derived.summary}
      </div>
    </div>
  );
}
