import { useStore } from '../store/useStore';
import { Play, RotateCcw, StepForward, CheckCircle } from 'lucide-react';

export default function RehearsalController() {
  const plan = useStore(state => state.plan);
  const startRehearsal = useStore(state => state.startRehearsal);
  const stepRehearsal = useStore(state => state.stepRehearsal);
  const resetRehearsal = useStore(state => state.resetRehearsal);
  const markRehearsal = useStore(state => state.markRehearsal);

  const hasUnresolvedIssues = plan.issues.some(i => !i.resolved);

  return (
    <div className="flex flex-col gap-2 p-4 bg-white border border-slate-200 rounded shadow-sm m-8 max-w-sm">
      <h3 className="font-semibold text-sm">Rehearsal</h3>

      <div className="flex gap-2">
        <button
          onClick={startRehearsal}
          disabled={hasUnresolvedIssues || plan.rehearsal.status !== 'not-run'}
          className="flex-1 flex justify-center items-center gap-2 py-2 bg-slate-800 text-white rounded text-sm disabled:opacity-50"
        >
          <Play className="w-4 h-4" /> Start
        </button>

        <button
          onClick={stepRehearsal}
          disabled={!['start', 'ready'].includes(plan.rehearsal.status)}
          className="flex-1 flex justify-center items-center gap-2 py-2 bg-blue-100 text-blue-800 rounded text-sm disabled:opacity-50"
        >
          <StepForward className="w-4 h-4" /> Step
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={resetRehearsal}
          disabled={plan.rehearsal.status === 'not-run'}
          className="flex-1 flex justify-center items-center gap-2 py-2 border border-slate-300 text-slate-700 rounded text-sm disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>

        <button
          onClick={markRehearsal}
          disabled={plan.rehearsal.status !== 'complete'}
          className="flex-1 flex justify-center items-center gap-2 py-2 bg-green-100 text-green-800 rounded text-sm disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" /> Verify
        </button>
      </div>

      <div className="text-xs text-slate-500 mt-2">
        Status: <span className="font-mono text-slate-700 bg-slate-100 px-1 rounded">{plan.rehearsal.status}</span>
        {plan.rehearsal.mark && <div className="mt-1 text-green-600">Mark: {plan.rehearsal.mark}</div>}
      </div>
    </div>
  );
}
