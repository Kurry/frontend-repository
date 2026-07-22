import React from 'react';
import { useLambdaStore } from '../store';

export const HistoryPanel = () => {
  const history = useLambdaStore(state => state.history);
  const reviews = useLambdaStore(state => state.reviews);
  const frames = useLambdaStore(state => state.frames);
  const phase = useLambdaStore(state => state.phase);

  return (
    <div className="w-80 border-l p-4 bg-white h-full overflow-y-auto">
      <h2 className="font-bold text-lg mb-4">Inspection Panel</h2>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-2">Phase</h3>
        <span className={`px-2 py-1 rounded text-sm ${phase === 'Draft' ? 'bg-gray-200' : phase === 'Proof' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
          {phase}
        </span>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-2">Free Variables</h3>
        <code className="block p-2 bg-slate-50 border rounded text-sm">
          {phase === 'Invalid' ? '{}' : '{y: 1}'}
        </code>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-2">Replay Frames ({frames.length})</h3>
        <div className="flex flex-col gap-2">
          {frames.map(f => (
            <div key={f.frameIndex} className="text-xs p-2 bg-slate-50 border rounded">
              <div className="font-bold">{f.stage}</div>
              <div>{f.activeNamedForm}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
