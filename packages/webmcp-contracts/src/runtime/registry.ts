import { FORBIDDEN_INPUT_KEYS } from "../constants.js";
import { RegistrationError } from "../errors.js";
import type { CompiledTool, Disposable, WebMcpHost } from "../types.js";
import {
  assertNoForbiddenInputKeys,
  boundAcknowledgement,
} from "../security/limits.js";
import type { NavigationEpochClock } from "./epochs.js";

type ScopeRecord = {
  scopeId: string;
  toolNames: string[];
  disposables: Disposable[];
  abort: AbortController;
};

export class ToolRegistry {
  readonly #host: WebMcpHost;
  readonly #epochs: NavigationEpochClock;
  readonly #scopes = new Map<string, ScopeRecord>();
  readonly #toolOwners = new Map<string, string>();
  readonly #tools = new Map<string, CompiledTool>();

  constructor(host: WebMcpHost, epochs: NavigationEpochClock) {
    this.#host = host;
    this.#epochs = epochs;
  }

  get registeredNames(): string[] {
    return [...this.#tools.keys()].sort();
  }

  getTool(name: string): CompiledTool | undefined {
    return this.#tools.get(name);
  }

  register(scopeId: string, tools: CompiledTool[]): Disposable {
    if (!scopeId) {
      throw new RegistrationError("scopeId is required");
    }
    this.unregister(scopeId);

    const abort = new AbortController();
    const disposables: Disposable[] = [];
    const toolNames: string[] = [];

    for (const tool of tools) {
      if (this.#toolOwners.has(tool.name)) {
        throw new RegistrationError(
          `Tool name collision: ${tool.name} already registered by scope ${this.#toolOwners.get(tool.name)}`,
        );
      }

      const execute = async (rawInput: unknown): Promise<unknown> => {
        if (abort.signal.aborted) {
          return boundAcknowledgement({
            ok: false,
            status: "aborted",
            navigation_epoch: this.#epochs.current,
            message: "Scope disposed",
          });
        }
        const input =
          rawInput && typeof rawInput === "object" && !Array.isArray(rawInput)
            ? (rawInput as Record<string, unknown>)
            : {};
        assertNoForbiddenInputKeys(input, FORBIDDEN_INPUT_KEYS);
        const result = await tool.execute(input, {
          signal: abort.signal,
          navigationEpoch: this.#epochs.current,
          scopeId,
          toolName: tool.name,
        });
        return boundAcknowledgement(result);
      };

      const hostDisposable = this.#host.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
        execute,
      });
      if (hostDisposable) disposables.push(hostDisposable);

      this.#tools.set(tool.name, tool);
      this.#toolOwners.set(tool.name, scopeId);
      toolNames.push(tool.name);
    }

    this.#scopes.set(scopeId, { scopeId, toolNames, disposables, abort });

    return {
      dispose: () => this.unregister(scopeId),
    };
  }

  unregister(scopeId: string): void {
    const scope = this.#scopes.get(scopeId);
    if (!scope) return;
    scope.abort.abort();
    for (const d of scope.disposables) d.dispose();
    for (const name of scope.toolNames) {
      this.#host.unregisterTool?.(name);
      this.#tools.delete(name);
      this.#toolOwners.delete(name);
    }
    this.#scopes.delete(scopeId);
  }

  unregisterAll(): void {
    for (const scopeId of [...this.#scopes.keys()]) {
      this.unregister(scopeId);
    }
  }

  async invoke(
    name: string,
    input: unknown,
    expectedNavigationEpoch?: number,
  ): Promise<unknown> {
    this.#epochs.assertExpected(expectedNavigationEpoch);
    const tool = this.#tools.get(name);
    if (!tool) {
      throw new RegistrationError(`Tool not registered: ${name}`);
    }
    const scopeId = this.#toolOwners.get(name);
    if (!scopeId) {
      throw new RegistrationError(`Tool owner missing: ${name}`);
    }
    const scope = this.#scopes.get(scopeId);
    if (!scope) {
      throw new RegistrationError(`Scope missing for tool: ${name}`);
    }
    if (scope.abort.signal.aborted) {
      throw new RegistrationError(`Scope aborted: ${scopeId}`);
    }
    const normalized =
      input && typeof input === "object" && !Array.isArray(input)
        ? (input as Record<string, unknown>)
        : {};
    assertNoForbiddenInputKeys(normalized, FORBIDDEN_INPUT_KEYS);
    const result = await tool.execute(normalized, {
      signal: scope.abort.signal,
      navigationEpoch: this.#epochs.current,
      scopeId,
      toolName: name,
    });
    return boundAcknowledgement(result);
  }
}
