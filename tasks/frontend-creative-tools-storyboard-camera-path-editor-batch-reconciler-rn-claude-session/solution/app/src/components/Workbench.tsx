import { CollectionList } from './CollectionList';
import { BatchReconciler } from './BatchReconciler';
import { DetailPanel } from './DetailPanel';
import { Video } from 'lucide-react';

export function Workbench() {
  return (
    <div className="flex flex-col h-screen bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">
      <header className="h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center px-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
            <Video className="w-4 h-4" />
          </div>
          <h1 className="font-semibold text-sm tracking-tight">Camera Path Editor</h1>
          <span className="px-1.5 py-0.5 rounded-sm bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500 font-medium ml-2 uppercase tracking-widest border border-zinc-200 dark:border-zinc-700">Claude Session</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="w-full md:w-1/3 max-w-sm h-1/2 md:h-full z-10">
          <CollectionList />
        </div>

        <div className="flex-1 min-w-0 h-1/2 md:h-full z-0">
          <BatchReconciler />
        </div>

        <div className="hidden lg:block w-72 h-full z-10">
          <DetailPanel />
        </div>
      </main>
    </div>
  );
}
