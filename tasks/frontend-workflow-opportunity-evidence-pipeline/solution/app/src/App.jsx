import { state, setState, resetStore } from './store';
import { createMemo } from 'solid-js';
import KanbanBoard from './components/KanbanBoard';
import Workspace from './components/Workspace';

export default function App() {
  return (
    <div class="h-screen w-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden font-sans">
      <header class="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
        <div class="flex items-center gap-4">
            <h1 class="font-bold text-lg tracking-tight">Opportunity Evidence Pipeline</h1>
        </div>
        <div class="flex items-center gap-3">
          <button onClick={resetStore} class="text-sm px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded border transition-colors">
            Reset Fixtures
          </button>
        </div>
      </header>

      <main class="flex-1 flex overflow-hidden">
        <KanbanBoard />
        <Workspace />
      </main>
    </div>
  );
}
