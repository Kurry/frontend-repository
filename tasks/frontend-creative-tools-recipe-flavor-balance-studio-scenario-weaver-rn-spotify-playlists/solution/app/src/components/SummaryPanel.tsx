import { useStore } from '../store';
import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export function SummaryPanel() {
  const { records } = useStore();

  const total = records.length;
  const statuses = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgProfile = records.reduce((acc, r) => {
    acc.sweetness += r.profile.sweetness;
    acc.acidity += r.profile.acidity;
    acc.saltiness += r.profile.saltiness;
    acc.bitterness += r.profile.bitterness;
    acc.umami += r.profile.umami;
    return acc;
  }, { sweetness: 0, acidity: 0, saltiness: 0, bitterness: 0, umami: 0 });

  if (total > 0) {
    avgProfile.sweetness /= total;
    avgProfile.acidity /= total;
    avgProfile.saltiness /= total;
    avgProfile.bitterness /= total;
    avgProfile.umami /= total;
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg p-4 border border-zinc-800">
      <div className="flex items-center gap-2 mb-4 text-zinc-200">
        <BarChart3 size={20} />
        <h2 className="text-lg font-bold">Derived Summary</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/40 p-3 rounded-lg text-center">
          <div className="text-3xl font-bold font-mono">{total}</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Records</div>
        </div>
        <div className="bg-black/40 p-3 rounded-lg text-center">
          <div className="text-3xl font-bold font-mono text-primary">{statuses['changed'] || 0}</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Changed</div>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Average Profile</h3>
      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {Object.entries(avgProfile).map(([key, value]) => (
          <div key={key} className="relative h-6 bg-black/40 rounded overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(value / 10) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full bg-primary/80"
            />
            <div className="absolute inset-0 flex justify-between items-center px-2 text-xs font-semibold z-10 mix-blend-difference text-white">
              <span className="capitalize">{key}</span>
              <span className="font-mono">{value.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
