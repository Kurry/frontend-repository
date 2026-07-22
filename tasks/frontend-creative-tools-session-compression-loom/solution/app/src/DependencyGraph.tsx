import { type Component, For } from 'solid-js';
import { state } from './store';

export const DependencyGraph: Component = () => {
  return (
    <div class="flex-1 border border-slate-700 p-4 overflow-auto">
      <h2 class="text-xl font-bold mb-4">Dependency Graph</h2>
      <div class="relative w-full h-full min-h-[200px] border border-slate-800 bg-slate-900 rounded">
        <svg class="absolute inset-0 w-full h-full">
            {/* Mock edges */}
            <line x1="50" y1="50" x2="150" y2="50" stroke="#475569" stroke-width="2" />
            <line x1="150" y1="50" x2="250" y2="100" stroke="#475569" stroke-width="2" />
        </svg>
        {/* Mock nodes */}
        <div class="absolute w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center top-[34px] left-[34px] z-10 text-xs">E1</div>
        <div class="absolute w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center top-[34px] left-[134px] z-10 text-xs">E2</div>
        <div class="absolute w-12 h-8 bg-purple-600 rounded flex items-center justify-center top-[84px] left-[234px] z-10 text-xs text-center leading-none">C1</div>
      </div>
    </div>
  );
};
