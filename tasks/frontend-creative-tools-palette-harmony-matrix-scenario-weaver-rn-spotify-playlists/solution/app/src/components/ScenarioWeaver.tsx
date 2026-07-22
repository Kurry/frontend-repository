import { useStore } from '../store';
import { motion } from 'framer-motion';

export function ScenarioWeaver() {
  const { scenarioColorId, records, updateScenarioHex, resolveScenario, cancelScenario } = useStore();

  const record = records.find(r => r.id === scenarioColorId);
  const isReducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  if (!scenarioColorId || !record) {
    return (
      <div className="flex flex-col h-full bg-bg-elevated rounded-lg p-8 items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <span className="text-2xl opacity-50">✦</span>
        </div>
        <h2 className="text-xl font-bold text-text-title mb-2">Scenario Weaver</h2>
        <p className="text-text-base max-w-sm">
          Select a color from the collection to branch it into a scenario and compare linked outcomes.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      layout={!isReducedMotion}
      initial={!isReducedMotion ? { opacity: 0, y: 20 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full bg-bg-elevated rounded-lg overflow-hidden border border-primary/30"
    >
      <div className="p-4 border-b border-white/10 bg-primary/10">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <span>Weaving Scenario:</span>
          <span className="text-white">{record.name}</span>
        </h2>
      </div>

      <div className="flex-1 p-6 space-y-6">
        <div className="flex gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-semibold text-text-base uppercase tracking-wider">Original</label>
            <div
              className="h-32 rounded-lg border border-white/10 shadow-inner"
              style={{ backgroundColor: record.scenarioState?.originalHex || record.hex }}
            />
            <div className="text-center font-mono text-sm text-text-base">
              {record.scenarioState?.originalHex || record.hex}
            </div>
          </div>
          <div className="flex items-center text-text-base/50">
            ➔
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-sm font-semibold text-primary uppercase tracking-wider">Branched Outcome</label>
            <div
              className="h-32 rounded-lg border border-primary shadow-inner"
              style={{ backgroundColor: record.hex }}
            />
            <div className="text-center font-mono text-sm font-bold text-primary">
              {record.hex}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-title mb-2" htmlFor="hex-input">
              Adjust Hex Value
            </label>
            <input
              id="hex-input"
              type="text"
              value={record.hex}
              onChange={(e) => updateScenarioHex(e.target.value)}
              className="w-full bg-bg-base border border-white/20 rounded p-2 text-text-title font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-2 pt-4">
             <label className="block text-sm font-medium text-text-title">Resolve Scenario As</label>
             <div className="grid grid-cols-3 gap-3">
               <button
                 onClick={() => resolveScenario('ready')}
                 className="py-2 bg-primary hover:bg-primary-dark text-black font-semibold rounded transition-colors"
               >
                 Ready
               </button>
               <button
                 onClick={() => resolveScenario('changed')}
                 className="py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded transition-colors"
               >
                 Changed
               </button>
               <button
                 onClick={() => resolveScenario('archived')}
                 className="py-2 bg-white/10 hover:bg-white/20 text-text-title font-semibold rounded transition-colors"
               >
                 Archive
               </button>
             </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end">
         <button
           onClick={cancelScenario}
           className="px-4 py-2 text-sm text-text-base hover:text-white transition-colors"
         >
           Cancel & Revert
         </button>
      </div>
    </motion.div>
  );
}
