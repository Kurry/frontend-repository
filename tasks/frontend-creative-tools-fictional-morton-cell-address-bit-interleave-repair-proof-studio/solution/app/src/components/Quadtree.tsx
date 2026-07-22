import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { calculatePrefixes } from '../lib/domain';

export function Quadtree() {
  const order = useStore((s) => s.order);
  const prefixes = calculatePrefixes(order);

  return (
    <div className="flex flex-col space-y-4 p-4 bg-gray-50 border border-gray-200 rounded">
      <h3 className="font-black text-lg text-gray-800 border-b border-gray-300 pb-2">Quadtree Peels</h3>
      <AnimatePresence mode="popLayout">
        {prefixes.map((p) => (
          <motion.div
            key={`${p.depth}-${p.prefixBits}`}
            initial={{ opacity: 0, x: -20, rotateX: 45 }}
            animate={{ opacity: 1, x: 0, rotateX: 0 }}
            exit={{ opacity: 0, x: 20, rotateX: -45 }}
            transition={{ duration: 0.3 }}
            className={`p-3 rounded border-2 ${p.depth === 3 ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300'} shadow-sm flex justify-between items-center`}
          >
            <div>
              <div className="font-bold text-gray-700">Depth {p.depth} {p.quadrantId && <span className="text-blue-600 bg-blue-50 px-1 rounded ml-1">{p.quadrantId}</span>}</div>
              <div className="text-xs text-gray-500 font-mono mt-1">Prefix: {p.prefixBits || 'empty'}</div>
            </div>
            <div className="text-right text-sm">
              <div>Interval: <span className="font-mono bg-gray-100 px-1 rounded">[{p.minCode}, {p.maxCode}]</span></div>
              <div className="text-xs text-gray-500 mt-1">x({p.minX}-{p.maxX}), y({p.minY}-{p.maxY})</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
