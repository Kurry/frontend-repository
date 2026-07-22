import { useStore, useDerivedState } from '../store';

export function Layout({ children }: { children: React.ReactNode }) {
  const policy = useStore(state => state.policy);
  const { costs } = useDerivedState(policy);
  const overconstrained = Object.keys(costs).some(k => costs[k] > policy.allocations[k]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold tracking-tight">Reasoning-Budget Sculptor</h1>
        <div className="flex gap-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${overconstrained ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {overconstrained ? 'Overconstrained' : 'Valid'}
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
