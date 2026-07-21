import { createSignal, onCleanup } from "solid-js";

export function usePrefersReducedMotion() {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  const [reducedMotion, setReducedMotion] = createSignal(query.matches);
  const update = (event: MediaQueryListEvent) => setReducedMotion(event.matches);

  query.addEventListener("change", update);
  onCleanup(() => query.removeEventListener("change", update));

  return reducedMotion;
}
