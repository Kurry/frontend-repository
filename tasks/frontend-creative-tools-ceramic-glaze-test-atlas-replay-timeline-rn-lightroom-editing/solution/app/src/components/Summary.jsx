import React from 'react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { Layers, CheckCircle2, Clock } from 'lucide-react';

export default function Summary() {
  const { derived } = useStore();

  return (
    <div>
      <h3 className="text-lg font-medium text-slate-800 mb-6">Collection Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Tests</p>
            <p className="text-2xl font-bold text-slate-900">{derived.totalTests}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Ready Tests</p>
            <p className="text-2xl font-bold text-slate-900">{derived.readyTests}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Latest Change</p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {derived.latestChangedAt
                ? format(new Date(derived.latestChangedAt), 'MMM d, yyyy h:mm a')
                : 'No changes yet'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
