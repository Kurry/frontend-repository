import type { DerivedState } from '../types';
import { PieChart, List, Clock, CheckCircle, Book, Archive, AlertTriangle } from 'lucide-react';

export function SummaryPanel({ derived }: { derived: DerivedState }) {
  const { summary } = derived;

  const stats = [
    { label: 'Total Books', value: summary.total, icon: <List size={16} />, color: 'text-slate-600' },
    { label: 'Draft', value: summary.draft, icon: <Clock size={16} />, color: 'text-slate-500' },
    { label: 'Ready', value: summary.ready, icon: <CheckCircle size={16} />, color: 'text-emerald-600' },
    { label: 'Changed', value: summary.changed, icon: <Book size={16} />, color: 'text-blue-600' },
    { label: 'Archived', value: summary.archived, icon: <Archive size={16} />, color: 'text-amber-600' },
    { label: 'Quarantined', value: summary.quarantined, icon: <AlertTriangle size={16} />, color: 'text-red-600' },
  ];

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <PieChart size={18} className="text-blue-600" />
        Dashboard
      </h2>

      <div className="space-y-3 flex-1">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100 shadow-sm">
            <div className={`flex items-center gap-2 ${stat.color} font-medium`}>
              {stat.icon}
              <span className="text-sm">{stat.label}</span>
            </div>
            <span className="text-lg font-bold text-slate-700">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
        <h3 className="font-semibold mb-1">Local State Only</h3>
        <p>This is a frontend-only tool. Data is not saved unless exported.</p>
      </div>
    </div>
  );
}
