import { type Component, createMemo } from 'solid-js';
import { state } from './store';

export const TokenRuler: Component = () => {
  const totalTokens = createMemo(() =>
    state.events.reduce((sum, e) => sum + e.tokens, 0)
  );

  const capsuleTokens = createMemo(() =>
    state.capsules.reduce((sum, c) => sum + 100, 0) // Mock token usage per capsule
  );

  const usedTokens = createMemo(() => {
    // In a real app this would compute raw retained + capsule weights
    return Math.max(0, totalTokens() - (state.capsules.length * 200) + capsuleTokens());
  });

  const percentage = createMemo(() =>
    Math.min(100, (usedTokens() / state.cap) * 100)
  );

  return (
    <div class="border border-slate-700 p-4">
      <h2 class="text-xl font-bold mb-4">Token Ruler</h2>
      <div class="flex justify-between text-sm mb-1">
        <span>Used: {usedTokens()}</span>
        <span>Cap: {state.cap}</span>
      </div>
      <div class="h-4 bg-slate-800 rounded relative overflow-hidden">
        <div
          class={`h-full absolute left-0 top-0 transition-all ${usedTokens() > state.cap ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${percentage()}%` }}
        />
      </div>
    </div>
  );
};
