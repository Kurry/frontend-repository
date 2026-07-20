export const motion = $state({
  reduced: typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
});

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    motion.reduced = e.matches;
  });
}
