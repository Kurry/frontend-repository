export const motion = $state({
  reduced:
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  density: 'comfortable' as 'comfortable' | 'compact',
});

if (typeof window !== 'undefined') {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => {
    motion.reduced = media.matches || document.documentElement.dataset.reducedMotion === 'true';
    document.documentElement.classList.toggle('reduce-motion', motion.reduced);
  };
  media.addEventListener('change', sync);
  sync();
}

export function setReducedMotion(enabled: boolean): void {
  motion.reduced = enabled;
  document.documentElement.dataset.reducedMotion = enabled ? 'true' : 'false';
  document.documentElement.classList.toggle('reduce-motion', enabled);
}

export function toggleDensity(): void {
  motion.density = motion.density === 'comfortable' ? 'compact' : 'comfortable';
  document.documentElement.dataset.density = motion.density;
}
