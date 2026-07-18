import type { ContractRuntime } from "../runtime/contract-runtime.js";
import type { CompiledTool, Disposable } from "../types.js";

/** Minimal React hooks surface — avoids hard compile dep on react. */
export type ReactHooksLike = {
  useEffect: (effect: () => void | (() => void), deps: unknown[]) => void;
  useRef: <T>(initial: T) => { current: T };
};

export type ReactMountOptions = {
  runtime: ContractRuntime;
  scopeId: string;
  tools: CompiledTool[] | (() => CompiledTool[]);
  hooks: ReactHooksLike;
  deps?: unknown[];
  bumpEpochOnMount?: boolean;
};

/**
 * React 19 hook factory: register WebMCP tools for the component lifetime.
 * Pass `{ useEffect, useRef }` from `react` as `hooks`.
 */
export function useWebMcpContracts(options: ReactMountOptions): void {
  const { useEffect, useRef } = options.hooks;
  const toolsRef = useRef(options.tools);
  toolsRef.current = options.tools;
  const deps = options.deps ?? [];

  useEffect(() => {
    if (options.bumpEpochOnMount) {
      options.runtime.bumpNavigationEpoch();
    }
    const resolved =
      typeof toolsRef.current === "function"
        ? toolsRef.current()
        : toolsRef.current;
    const disposable: Disposable = options.runtime.register(
      options.scopeId,
      resolved,
    );
    return () => disposable.dispose();
  }, [options.runtime, options.scopeId, ...deps]);
}

export function mountReactWebMcp(options: {
  runtime: ContractRuntime;
  scopeId: string;
  tools: CompiledTool[] | (() => CompiledTool[]);
}): () => void {
  const tools =
    typeof options.tools === "function" ? options.tools() : options.tools;
  const disposable = options.runtime.register(options.scopeId, tools);
  return () => disposable.dispose();
}

export function notifyReactNavigation(runtime: ContractRuntime): number {
  return runtime.bumpNavigationEpoch();
}
