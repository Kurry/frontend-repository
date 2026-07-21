import React, { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { lastMutationAtom } from '../store.js';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

const textFor = (m) => {
  switch (m.kind) {
    case 'added': return `Added “${m.label}”`;
    case 'updated': return `Updated “${m.label}”`;
    case 'deleted': return m.label ? `Deleted “${m.label}”` : 'Deleted event';
    case 'bulk-category': return `Category added to ${m.label}`;
    case 'bulk-delete': return `${m.label} deleted`;
    case 'import': return `Imported ${m.label}`;
    case 'undo': return 'Undid last change';
    case 'redo': return 'Redid change';
    default: return '';
  }
};

export function Toast() {
  const mutation = useAtomValue(lastMutationAtom);
  const setLastMutation = useSetAtom(lastMutationAtom);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!mutation) return undefined;
    const t = window.setTimeout(() => setLastMutation(null), 2800);
    return () => window.clearTimeout(t);
  }, [mutation, setLastMutation]);

  return (
    <div
      className="fixed left-4 bottom-24 z-[calc(var(--z-modal)+1)] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {mutation && (
          <motion.div
            key={mutation.at}
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: 'easeOut' }}
            className="bg-[var(--c-ink)] text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg border border-white/10"
          >
            {textFor(mutation)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
