import { useStore } from '../store';
import { clsx } from 'clsx';
import { useState } from 'react';

export function RackRibbon() {
  const intervals = useStore(state => state.intervals);
  const logicalTick = useStore(state => state.logicalTick);
  const advanceClock = useStore(state => state.advanceClock);

  const [targetTick, setTargetTick] = useState(logicalTick.toString());

  const maxTick = Math.max(...intervals.map(i => i.endTick), 0);
  const scale = 400 / Math.max(maxTick, 130);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">Rack Ribbon</h2>
      <div className="relative border border-gray-300 bg-gray-50 h-32" style={{ width: '400px' }}>
        {intervals.map((int, i) => (
          <div
            key={int.id}
            className={clsx(
              "absolute h-4 border border-black/10 rounded-sm text-[10px] flex items-center px-1 overflow-hidden",
              int.kind === 'print' ? "bg-blue-200" : "bg-orange-200"
            )}
            style={{
              left: `${int.startTick * scale}px`,
              width: `${(int.endTick - int.startTick) * scale}px`,
              top: `${(i % 4) * 20 + 10}px`
            }}
            title={`${int.kind} [${int.startTick}, ${int.endTick}) - ${int.status}`}
          >
            {int.kind === 'print' ? 'P' : 'S'}
          </div>
        ))}
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{ left: `${logicalTick * scale}px` }}
        />
      </div>

      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium">Tick:</label>
        <input
          type="number"
          className="border border-gray-300 rounded px-2 py-1 w-24"
          value={targetTick}
          onChange={e => setTargetTick(e.target.value)}
          min={logicalTick}
        />
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          onClick={() => {
            const next = parseInt(targetTick, 10);
            if (!isNaN(next) && next > logicalTick) {
              advanceClock(next);
            }
          }}
        >
          Advance
        </button>
      </div>
    </div>
  );
}
