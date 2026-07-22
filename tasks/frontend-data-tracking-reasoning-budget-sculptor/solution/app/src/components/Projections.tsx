import { useMemo } from 'react';
import { useStore, useDerivedState } from '../store';
import { FIXTURE } from '../fixture';

export function Projections() {
  const policy = useStore(state => state.policy);
  const { events, costs } = useDerivedState(policy);

  const retainedCount = events.filter(e => ['retained', 'pinned', 'rescued'].includes(e.state)).length;
  const totalEvents = events.length;

  let brokenEdges = 0;
  FIXTURE.dependencies.forEach(dep => {
    const fromE = events.find(e => e.id === dep.from);
    const toE = events.find(e => e.id === dep.to);
    const fromRetained = fromE && ['retained', 'pinned', 'rescued'].includes(fromE.state);
    const toRetained = toE && ['retained', 'pinned', 'rescued'].includes(toE.state);
    if (toRetained && !fromRetained) {
      brokenEdges++;
    }
  });

  const comparisonPolicy = useMemo(() => {
    if (!policy.comparison) return null;
    return policy.checkpoints.find(c => c.name === policy.comparison);
  }, [policy.comparison, policy.checkpoints]);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Projections & Stats</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-slate-50 rounded border">
          <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Retained Events</div>
          <div className="text-2xl font-bold">{retainedCount} <span className="text-sm font-normal text-slate-500">/ {totalEvents}</span></div>
        </div>
        <div className="p-3 bg-slate-50 rounded border">
          <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Broken Edges</div>
          <div className={`text-2xl font-bold ${brokenEdges > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {brokenEdges}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Phase Costs vs Budget</h3>
        <div className="flex flex-col gap-2">
          {FIXTURE.phases.map(p => {
            const cost = costs[p.id];
            const alloc = policy.allocations[p.id];
            const pct = Math.min((cost / alloc) * 100, 100);
            const over = cost > alloc;
            return (
              <div key={p.id} className="flex items-center text-xs">
                <div className="w-16 font-medium text-slate-600">{p.name}</div>
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden mx-2 relative">
                  <div
                    className={`absolute top-0 left-0 h-full ${over ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-24 text-right tabular-nums">
                  <span className={over ? 'text-red-600 font-bold' : ''}>{cost}</span> / {alloc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {comparisonPolicy && (
        <div className="p-3 bg-purple-50 rounded border border-purple-200 mt-auto">
          <h3 className="text-sm font-semibold text-purple-900 mb-2">Compare: {comparisonPolicy.name}</h3>
          <div className="flex flex-col gap-1 text-xs">
            {FIXTURE.phases.map(p => {
              const diff = policy.allocations[p.id] - comparisonPolicy.allocations[p.id];
              if (diff === 0) return null;
              return (
                <div key={p.id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className={diff > 0 ? 'text-green-600' : 'text-red-600'}>
                    {diff > 0 ? '+' : ''}{diff}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
