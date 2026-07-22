import { useEffect } from 'react';
import { AppHeader } from './components/AppHeader';
import { CheckpointsList } from './components/CheckpointsList';
import { RecoveryBoard } from './components/RecoveryBoard';
import { Summary } from './components/Summary';
import { useStore } from './store';
import type { DrillCheckpoint } from './types';

const INITIAL_FIXTURES: DrillCheckpoint[] = [
  { id: 'c1', title: 'North Wing Evacuation', area: 'Building A - North', status: 'ready', description: 'All clear.' },
  { id: 'c2', title: 'South Stairwell Blockage', area: 'Building A - South', status: 'draft', description: 'Simulated debris in stairwell.' },
  { id: 'c3', title: 'East Exit Overflow', area: 'Building B - East', status: 'empty', description: '' },
  { id: 'c4', title: 'Assembly Point Alpha', area: 'Courtyard', status: 'archived', description: 'Previous drill.' },
];

function App() {
  const { seed, records } = useStore();

  useEffect(() => {
    if (records.length === 0) {
      seed(INITIAL_FIXTURES);
    }
  }, [seed, records.length]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5">
              <CheckpointsList />
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 h-full">
            <Summary />
            <div className="flex-1 min-h-[400px]">
              <RecoveryBoard />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
