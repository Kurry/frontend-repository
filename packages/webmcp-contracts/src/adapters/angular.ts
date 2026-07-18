import type { ContractRuntime } from "../runtime/contract-runtime.js";
import type { CompiledTool, Disposable } from "../types.js";

/** Minimal DestroyRef surface — avoids hard compile dep on @angular/core. */
export type AngularDestroyRefLike = {
  onDestroy: (callback: () => void) => void;
};

export type AngularMountOptions = {
  runtime: ContractRuntime;
  scopeId: string;
  tools: CompiledTool[] | (() => CompiledTool[]);
  destroyRef: AngularDestroyRefLike;
  bumpEpochOnMount?: boolean;
};

/**
 * Angular lifecycle adapter. Call from the component constructor or ngOnInit
 * with `inject(DestroyRef)`.
 */
export function mountAngularWebMcp(options: AngularMountOptions): Disposable {
  if (options.bumpEpochOnMount) {
    options.runtime.bumpNavigationEpoch();
  }
  const tools =
    typeof options.tools === "function" ? options.tools() : options.tools;
  const disposable = options.runtime.register(options.scopeId, tools);
  options.destroyRef.onDestroy(() => disposable.dispose());
  return disposable;
}

export function notifyAngularNavigation(runtime: ContractRuntime): number {
  return runtime.bumpNavigationEpoch();
}
