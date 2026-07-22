import { For } from 'solid-js';
import { state } from './store.js';
import { simulateSteps } from './simulator.js';

export default function AccountCards() {
  // Compute state at max slot for display
  const maxSlot = Math.max(...state.transactions.flatMap(tx => tx.phases.map(p => p.slot || 0)));
  const simResult = simulateSteps(state.transactions, state.accounts, state.strategy, maxSlot);

  const currentStepData = simResult.history[state.currentStep] || simResult.history[simResult.history.length - 1];

  const totalBalance = currentStepData.accState.reduce((sum, a) => sum + a.balance, 0);
  const conserved = totalBalance === 150;

  return (
    <div class="p-4 border rounded-lg bg-white">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Accounts Snapshot</h2>
        <div class={`px-3 py-1 rounded text-sm font-bold ${conserved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          Total: {totalBalance} / 150 {conserved ? '✓' : '✗'}
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <For each={currentStepData.accState}>
          {(acc) => (
            <div class={`border p-4 rounded-lg shadow-sm ${acc.balance < 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <div class="flex justify-between border-b pb-2 mb-2">
                <span class="text-lg font-bold">Account {acc.id}</span>
                <span class="text-xs text-gray-500 bg-white px-2 py-1 rounded">v{acc.version}</span>
              </div>
              <div class="text-2xl font-mono text-center my-4">
                ${acc.balance}
              </div>
              {acc.balance < 0 && (
                <div class="text-xs text-red-600 text-center font-bold">
                  Negative Balance!
                </div>
              )}
            </div>
          )}
        </For>
      </div>

      <div class="mt-4 pt-4 border-t flex items-center justify-between">
         <span class="text-sm font-semibold">Step {currentStepData.step} of {maxSlot}</span>
      </div>
    </div>
  );
}
