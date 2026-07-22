import { useRef } from 'react';
import { useStore } from '../store';
import { FIXTURE } from '../fixture';

export function Timeline() {
  const policy = useStore(state => state.policy);
  const setAllocation = useStore(state => state.setAllocation);
  const toggleLock = useStore(state => state.toggleLock);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrag = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    const startX = e.clientX;
    const phase1 = FIXTURE.phases[index];
    const phase2 = FIXTURE.phases[index + 1];

    const startA = policy.allocations[phase1.id];
    const startB = policy.allocations[phase2.id];

    if (policy.lockedPhases[phase1.id] || policy.lockedPhases[phase2.id]) return;

    const onMove = (moveEvt: MouseEvent) => {
      const deltaX = moveEvt.clientX - startX;
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      const tokenDelta = Math.round((deltaX / width) * policy.totalCap);

      const newA = startA + tokenDelta;
      const newB = startB - tokenDelta;

      const minA = policy.pressure === 'min-increase' ? phase1.min + 500 : phase1.min;
      const minB = policy.pressure === 'min-increase' ? phase2.min + 500 : phase2.min;

      if (newA >= minA && newA <= phase1.max && newB >= minB && newB <= phase2.max) {
        setAllocation(phase1.id, newA, phase2.id);
      }
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const phase1 = FIXTURE.phases[index];
    const phase2 = FIXTURE.phases[index + 1];
    if (policy.lockedPhases[phase1.id] || policy.lockedPhases[phase2.id]) return;

    const step = e.shiftKey ? 1000 : 100;
    let delta = 0;
    if (e.key === 'ArrowRight') delta = step;
    else if (e.key === 'ArrowLeft') delta = -step;

    if (delta !== 0) {
      const newA = policy.allocations[phase1.id] + delta;
      const newB = policy.allocations[phase2.id] - delta;
      const minA = policy.pressure === 'min-increase' ? phase1.min + 500 : phase1.min;
      const minB = policy.pressure === 'min-increase' ? phase2.min + 500 : phase2.min;
      if (newA >= minA && newA <= phase1.max && newB >= minB && newB <= phase2.max) {
        setAllocation(phase1.id, newA, phase2.id);
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold mb-4">Conservation Timeline</h2>
      <div className="flex justify-between text-sm text-slate-500 mb-2">
        <span>0</span>
        <span>{policy.totalCap.toLocaleString()} Tokens</span>
      </div>
      <div
        ref={containerRef}
        className="relative h-12 flex rounded-lg overflow-hidden bg-slate-100 select-none border border-slate-300"
      >
        {FIXTURE.phases.map((p, i) => {
          const alloc = policy.allocations[p.id];
          const pct = (alloc / policy.totalCap) * 100;
          return (
            <div key={p.id} style={{ width: `${pct}%`, display: 'flex' }}>
              <div
                className={`relative flex items-center justify-center border-r border-slate-300 flex-1 ${policy.lockedPhases[p.id] ? 'bg-slate-200' : 'bg-blue-100'}`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold">{p.name}</span>
                  <span className="text-xs font-mono">{alloc}</span>
                </div>
                <button
                  onClick={() => toggleLock(p.id)}
                  className="absolute top-1 right-1 text-xs px-1 rounded hover:bg-black/10"
                  aria-label={`Lock ${p.name}`}
                >
                  {policy.lockedPhases[p.id] ? '🔒' : '🔓'}
                </button>
              </div>
              {i < FIXTURE.phases.length - 1 && (
                <div
                  className="w-2 -mx-1 z-10 cursor-col-resize hover:bg-blue-500 bg-transparent flex items-center justify-center focus:outline-none focus:ring"
                  onMouseDown={(e) => handleDrag(e, i)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  tabIndex={0}
                  role="slider"
                  aria-label={`Boundary between ${FIXTURE.phases[i].name} and ${FIXTURE.phases[i+1].name}`}
                >
                  <div className="w-[1px] h-full bg-slate-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
