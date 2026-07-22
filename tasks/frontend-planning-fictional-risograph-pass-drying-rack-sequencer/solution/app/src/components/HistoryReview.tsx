import { useStore } from '../store';
import { useState } from 'react';

export function HistoryReview() {
  const commitDecision = useStore(state => state.commitDecision);
  const revealCorrection = useStore(state => state.revealCorrection);
  const rebaseRun = useStore(state => state.rebaseRun);
  const approveRun = useStore(state => state.approveRun);

  const correctionRevealed = useStore(state => state.correctionRevealed);
  const decisions = useStore(state => state.decisions);
  const approval = useStore(state => state.approval);

  const [rationale, setRationale] = useState('');

  const activeDecisions = Object.values(decisions).filter(d => d.status === 'active');
  const hasDecision = activeDecisions.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">Decisions & Review</h2>

      <div className="p-3 border rounded">
        <h3 className="font-semibold mb-2">Record Proof Decision</h3>
        <textarea
          className="w-full border p-2 mb-2 rounded"
          placeholder="Rationale..."
          value={rationale}
          onChange={e => setRationale(e.target.value)}
        />
        <button
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          onClick={() => {
            if (rationale) commitDecision(rationale, 'working');
          }}
        >
          Prefer Proof
        </button>
        {hasDecision && <div className="mt-2 text-sm text-green-700">✓ Decision recorded</div>}
      </div>

      <div className="p-3 border rounded bg-yellow-50">
        <h3 className="font-semibold mb-2">Corrections</h3>
        {!correctionRevealed ? (
          <button
            className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
            onClick={() => revealCorrection()}
          >
            Reveal Correction (2042-04-08T16:40:00Z)
          </button>
        ) : (
          <div>
            <div className="text-sm text-yellow-800 mb-2">Cobalt settle tick corrected 20 → 30. Schedule is stale.</div>
            <button
              className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
              onClick={() => rebaseRun()}
            >
              Rebase Run
            </button>
          </div>
        )}
      </div>

      <div className="p-3 border rounded">
        <h3 className="font-semibold mb-2">Approval</h3>
        <button
          className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
          disabled={!hasDecision}
          onClick={() => approveRun()}
        >
          Approve Run
        </button>
        {approval && <div className="mt-2 text-sm text-purple-700">✓ Run Approved</div>}
      </div>
    </div>
  );
}
