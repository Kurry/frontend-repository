import { useStore, selectDerived } from '../store';
import { motion } from 'framer-motion';

export function LivePreview() {
  const records = useStore((state) => state.records);
  const derived = selectDerived(useStore.getState());

  return (
    <div className="bg-slate-900 rounded-3xl p-4 shadow-2xl border-4 border-slate-800 w-full max-w-[320px] mx-auto min-h-[600px] flex flex-col relative overflow-hidden">
      {/* Mobile top bar stub */}
      <div className="flex justify-between items-center mb-6 px-2 opacity-50">
        <span className="text-white text-xs">9:41</span>
        <div className="flex gap-1">
          <div className="w-4 h-2 bg-white rounded-sm"></div>
          <div className="w-3 h-2 bg-white rounded-sm"></div>
        </div>
      </div>

      <div className="text-white mb-6">
        <h3 className="text-lg font-bold mb-1">Scenario App</h3>
        <p className="text-xs text-slate-400">Live Mobile Preview</p>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <div className="text-sm font-semibold text-white mb-2">Campaign Summary</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-700 p-2 rounded text-center">
            <div className="text-xs text-slate-400">Total</div>
            <div className="text-lg font-bold text-white">{derived.summary.total}</div>
          </div>
          <div className="bg-red-900/50 p-2 rounded text-center">
            <div className="text-xs text-red-300">Failed</div>
            <div className="text-lg font-bold text-red-400">{derived.summary.failed}</div>
          </div>
          <div className="bg-blue-900/50 p-2 rounded text-center">
            <div className="text-xs text-blue-300">Rec.</div>
            <div className="text-lg font-bold text-blue-400">{derived.summary.recovered}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-3 pb-6">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider sticky top-0 bg-slate-900 py-1">Deck</div>

        {records.length === 0 ? (
          <div className="text-slate-500 text-sm text-center mt-10">Empty Deck</div>
        ) : (
          records.map(record => (
            <motion.div
              key={record.id}
              layout
              className={`p-3 rounded-lg border flex flex-col gap-1 shadow-sm
                ${record.status === 'draft' ? 'bg-slate-800 border-slate-700' : ''}
                ${record.status === 'ready' ? 'bg-green-900/20 border-green-800' : ''}
                ${record.status === 'failed' ? 'bg-red-900/20 border-red-800' : ''}
                ${record.status === 'recovered' ? 'bg-blue-900/20 border-blue-800' : ''}
                ${record.status === 'archived' ? 'bg-slate-900 border-slate-800 opacity-50' : ''}
              `}
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-sm text-slate-100 leading-tight">{record.title}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded
                  ${record.status === 'failed' ? 'bg-red-900 text-red-200' : 'bg-slate-700 text-slate-300'}
                `}>
                  {record.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 mt-1">{record.description}</p>
            </motion.div>
          ))
        )}
      </div>

      {/* Home indicator stub */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-slate-600 rounded-full"></div>
    </div>
  );
}
