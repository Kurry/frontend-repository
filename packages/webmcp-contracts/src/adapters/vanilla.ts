import type { ContractRuntime } from "../runtime/contract-runtime.js";
import type { CompiledTool, Disposable } from "../types.js";

export type VanillaMountOptions = {
  runtime: ContractRuntime;
  scopeId: string;
  tools: CompiledTool[] | (() => CompiledTool[]);
  bumpEpochOnMount?: boolean;
};

/**
 * Vanilla / Astro route lifecycle: register tools and return an unmount fn.
 * Astro islands should call this in the client script and dispose on
 * `astro:before-swap` / view-transition leave.
 */
export function mountVanillaWebMcp(options: VanillaMountOptions): () => void {
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

export type AstroRouteLifecycleOptions = VanillaMountOptions & {
  /** Document or EventTarget that emits astro view-transition events. */
  eventTarget?: EventTarget;
};

/**
 * Astro-friendly helper: remount on `astro:page-load`, dispose on
 * `astro:before-swap`, and bump navigation epochs.
 */
export function attachAstroRouteLifecycle(
  options: AstroRouteLifecycleOptions,
): () => void {
  const target = options.eventTarget ?? globalThis;
  let disposable: Disposable | undefined;

  const mount = () => {
    disposable?.dispose();
    options.runtime.bumpNavigationEpoch();
    const tools =
      typeof options.tools === "function" ? options.tools() : options.tools;
    disposable = options.runtime.register(options.scopeId, tools);
  };

  const beforeSwap = () => {
    disposable?.dispose();
    disposable = undefined;
  };

  target.addEventListener("astro:page-load", mount as EventListener);
  target.addEventListener("astro:before-swap", beforeSwap as EventListener);
  mount();

  return () => {
    target.removeEventListener("astro:page-load", mount as EventListener);
    target.removeEventListener("astro:before-swap", beforeSwap as EventListener);
    disposable?.dispose();
  };
}

export function notifyVanillaNavigation(runtime: ContractRuntime): number {
  return runtime.bumpNavigationEpoch();
}
