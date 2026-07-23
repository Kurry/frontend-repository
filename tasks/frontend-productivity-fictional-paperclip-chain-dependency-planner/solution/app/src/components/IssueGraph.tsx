import { useStore } from '../store/useStore';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function IssueGraph() {
  const plan = useStore(state => state.plan);

  return (
    <div className="flex flex-col h-full text-sm relative">
      <h2 className="font-semibold mb-4 text-slate-800 sticky top-0 bg-white z-10 flex justify-between">
        <span>Issue Graph</span>
        <span className={plan.issues.every(i => i.resolved) ? 'text-green-600' : 'text-amber-600'}>
          {plan.issues.filter(i => !i.resolved).length} Open
        </span>
      </h2>

      <div className="flex flex-col gap-2">
        {plan.issues.length === 0 ? (
          <div className="text-slate-500 italic p-4 text-center">No issues detected.</div>
        ) : (
          plan.issues.map(issue => (
            <div
              key={issue.id}
              className={`p-3 rounded border flex gap-3 items-start
                ${issue.resolved ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-amber-50 border-amber-200'}
              `}
            >
              {issue.resolved ? (
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}

              <div>
                <div className="font-medium text-slate-800">{issue.id}</div>
                <div className="text-slate-600 mt-1">{issue.type}</div>
                <div className="text-xs font-mono mt-2 text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-100 inline-block">
                  Affected: {issue.taskId}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
