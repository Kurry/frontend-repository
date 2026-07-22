// Shared chart helpers: reduced-motion awareness, number formatting, and a
// small rAF tween used by the counter pane so recomputed values glide to their
// new figure instead of snapping.

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function formatValue(n: number): string {
  const rounded = Math.round(n);
  if (Math.abs(rounded) >= 1_000_000) return `${(rounded / 1_000_000).toFixed(1)}M`;
  if (Math.abs(rounded) >= 10_000) return `${(rounded / 1_000).toFixed(1)}K`;
  return rounded.toLocaleString();
}

/**
 * Animate `from` to `to` over `durationMs` with an ease-out curve, invoking
 * `onFrame` each animation frame. Returns a cancel function. When the user
 * prefers reduced motion the final value lands immediately.
 */
export function tweenNumber(
  from: number,
  to: number,
  durationMs: number,
  onFrame: (value: number) => void,
): () => void {
  if (prefersReducedMotion() || from === to || !Number.isFinite(from)) {
    onFrame(to);
    return () => {};
  }
  let frame = 0;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min((now - start) / durationMs, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    onFrame(from + (to - from) * eased);
    if (t < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}
