import type { ContractRuntime } from "../runtime/contract-runtime.js";
import type { CompiledTool, Disposable } from "../types.js";

export type SvelteMountOptions = {
  runtime: ContractRuntime;
  scopeId: string;
  tools: CompiledTool[] | (() => CompiledTool[]);
  /** When true, bump navigation epoch on mount (route enter). */
  bumpEpochOnMount?: boolean;
};

/**
 * Svelte 5 / Astro island lifecycle: register on mount, dispose on destroy.
 * Call from `onMount` and return the dispose function.
 */
export function mountSvelteWebMcp(options: SvelteMountOptions): () => void {
  if (options.bumpEpochOnMount) {
    options.runtime.bumpNavigationEpoch();
  }
  const tools =
    typeof options.tools === "function" ? options.tools() : options.tools;
  const disposable: Disposable = options.runtime.register(
    options.scopeId,
    tools,
  );
  return () => disposable.dispose();
}

/** Notify the runtime that a SvelteKit / SPA navigation completed. */
export function notifySvelteNavigation(runtime: ContractRuntime): number {
  return runtime.bumpNavigationEpoch();
}
