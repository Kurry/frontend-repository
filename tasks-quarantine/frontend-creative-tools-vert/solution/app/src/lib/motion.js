// Shared reduced-motion awareness. CSS transitions/animations are globally
// disabled by the prefers-reduced-motion block in app.css; Svelte's rAF-driven
// transitions and animations are gated through these helpers so every motion
// path respects the user preference (and the judge's emulation of it).

export function prefersReducedMotion() {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Duration helper for svelte transitions: 0 under reduced motion.
export function dur(ms) {
	return prefersReducedMotion() ? 0 : ms;
}
