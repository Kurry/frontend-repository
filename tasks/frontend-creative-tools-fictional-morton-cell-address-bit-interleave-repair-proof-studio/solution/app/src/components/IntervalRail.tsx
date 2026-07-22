import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { calculatePrefixes } from '../lib/domain';

export function IntervalRail() {
  const order = useStore((s) => s.order);
  const prefixes = calculatePrefixes(order);

  return (
    <div className="w-full bg-white p-4 rounded border border-gray-300 shadow-sm mt-4">
      <h3 className="font-black text-lg mb-4 text-gray-800">Inclusive Interval Rail</h3>
      <div className="relative h-12 bg-gray-100 rounded w-full overflow-hidden border border-gray-200">
        {prefixes.map((p) => {
          if (p.depth === 0) return null; // skip root
          const left = (p.minCode / 63) * 100;
          const width = ((p.maxCode - p.minCode) / 63) * 100;

          return (
            <motion.div
              key={`${p.depth}-${p.minCode}-${p.maxCode}`}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.3 }}
              className={`absolute top-0 bottom-0 border-x-2 flex items-center justify-center overflow-hidden
                ${p.depth === 1 ? 'bg-blue-200/40 border-blue-300 z-10' : ''}
                ${p.depth === 2 ? 'bg-blue-400/50 border-blue-500 z-20' : ''}
                ${p.depth === 3 ? 'bg-blue-600/60 border-blue-700 z-30' : ''}
              `}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`Depth ${p.depth}: [${p.minCode}, ${p.maxCode}]`}
            >
               {width > 5 && <span className="text-[10px] font-bold text-gray-800 truncate px-1">[{p.minCode},{p.maxCode}]</span>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
