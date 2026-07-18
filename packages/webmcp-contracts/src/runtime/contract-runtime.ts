import type {
  CompiledTool,
  Disposable,
  WebMcpHost,
} from "../types.js";
import { createDefaultHost } from "./host.js";
import { NavigationEpochClock } from "./epochs.js";
import { ToolRegistry } from "./registry.js";

export type ContractRuntimeOptions = {
  host?: WebMcpHost;
};

/**
 * Framework-neutral contract runtime.
 * Accepts builder-compiled tools / handlers; never owns product state.
 */
export class ContractRuntime {
  readonly epochs: NavigationEpochClock;
  readonly registry: ToolRegistry;
  readonly host: WebMcpHost;
  #rootAbort: AbortController;

  constructor(options: ContractRuntimeOptions = {}) {
    this.host = options.host ?? createDefaultHost();
    this.epochs = new NavigationEpochClock();
    this.registry = new ToolRegistry(this.host, this.epochs);
    this.#rootAbort = new AbortController();
  }

  get navigationEpoch(): number {
    return this.epochs.current;
  }

  get signal(): AbortSignal {
    return this.#rootAbort.signal;
  }

  bumpNavigationEpoch(): number {
    return this.epochs.bump();
  }

  register(scopeId: string, tools: CompiledTool[]): Disposable {
    if (this.#rootAbort.signal.aborted) {
      throw new Error("ContractRuntime has been disposed");
    }
    return this.registry.register(scopeId, tools);
  }

  unregister(scopeId: string): void {
    this.registry.unregister(scopeId);
  }

  listTools(): string[] {
    return this.registry.registeredNames;
  }

  async invoke(
    name: string,
    input: unknown = {},
    expectedNavigationEpoch?: number,
  ): Promise<unknown> {
    return this.registry.invoke(name, input, expectedNavigationEpoch);
  }

  /** Tear down all scopes and invalidate the root AbortController. */
  dispose(): void {
    this.registry.unregisterAll();
    this.#rootAbort.abort();
    this.#rootAbort = new AbortController();
  }
}

export function createContractRuntime(
  options?: ContractRuntimeOptions,
): ContractRuntime {
  return new ContractRuntime(options);
}
