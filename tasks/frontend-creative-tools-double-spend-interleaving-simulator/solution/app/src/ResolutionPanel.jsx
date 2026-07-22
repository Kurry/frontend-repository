import { state, updateStrategy } from './store.js';

export default function ResolutionPanel() {
  const strategies = [
    { id: 'none', label: 'None (Read Uncommitted)' },
    { id: 'optimistic-version', label: 'Optimistic Versioning' },
    { id: 'pessimistic-lock', label: 'Pessimistic Locking' },
    { id: 'serializable', label: 'Serializable' }
  ];

  return (
    <div class="border p-4 rounded-lg bg-white">
      <h2 class="text-xl font-bold mb-4">Strategy Switchboard & Resolution</h2>

      <div class="mb-6">
        <label class="block text-sm font-bold text-gray-700 mb-2">Isolation Strategy</label>
        <select
          class="w-full border rounded p-2 bg-gray-50"
          value={state.strategy}
          onChange={(e) => updateStrategy(e.target.value)}
        >
          {strategies.map(s => (
            <option value={s.id}>{s.label}</option>
          ))}
        </select>
        <p class="text-xs text-gray-500 mt-2">
          Changing strategy recalculates conflict detection and commit/rollback logic without changing the base schedule.
        </p>
      </div>

      <div class="border-t pt-4">
        <h3 class="text-sm font-bold text-gray-700 mb-2">Resolution Options (Actionable on Conflict)</h3>
        <div class="flex flex-wrap gap-2">
          <button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700 opacity-50 cursor-not-allowed">Wait</button>
          <button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700 opacity-50 cursor-not-allowed">Abort & Retry</button>
          <button class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700 opacity-50 cursor-not-allowed">Cancel Transaction</button>
        </div>
        <p class="text-xs text-gray-400 mt-2 italic">Select a conflict edge to resolve.</p>
      </div>
    </div>
  );
}
