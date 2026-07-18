import type { ContractRuntime } from "../runtime/contract-runtime.js";
import type { CompiledTool, Disposable } from "../types.js";

/** Minimal Vue composition surface — avoids hard compile dep on vue. */
export type VueHooksLike = {
  onMounted: (fn: () => void) => void;
  onUnmounted: (fn: () => void) => void;
  watch?: (source: unknown, cb: () => void) => void;
};

export type VueRefLike<T> = { value: T };

export type VueMountOptions = {
  runtime: ContractRuntime;
  scopeId: string;
  tools: CompiledTool[] | (() => CompiledTool[]) | VueRefLike<CompiledTool[]>;
  hooks: VueHooksLike;
  watchSource?: unknown;
  bumpEpochOnMount?: boolean;
};

/**
 * Vue 3 composition helper. Pass `{ onMounted, onUnmounted, watch }` from `vue`.
 */
export function useWebMcpContracts(options: VueMountOptions): void {
  let disposable: Disposable | undefined;
  const { onMounted, onUnmounted, watch } = options.hooks;

  const resolve = (): CompiledTool[] => {
    const t = options.tools;
    if (typeof t === "function") return t();
    if (t && typeof t === "object" && "value" in t) return t.value;
    return t;
  };

  const mount = () => {
    disposable?.dispose();
    if (options.bumpEpochOnMount) {
      options.runtime.bumpNavigationEpoch();
    }
    disposable = options.runtime.register(options.scopeId, resolve());
  };

  onMounted(mount);
  onUnmounted(() => {
    disposable?.dispose();
    disposable = undefined;
  });

  if (options.watchSource && watch) {
    watch(options.watchSource, () => {
      mount();
    });
  }
}

export function mountVueWebMcp(options: {
  runtime: ContractRuntime;
  scopeId: string;
  tools: CompiledTool[] | (() => CompiledTool[]);
}): () => void {
  const tools =
    typeof options.tools === "function" ? options.tools() : options.tools;
  const disposable = options.runtime.register(options.scopeId, tools);
  return () => disposable.dispose();
}

export function notifyVueNavigation(runtime: ContractRuntime): number {
  return runtime.bumpNavigationEpoch();
}
