import type { Disposable, HostToolRegistration, WebMcpHost } from "../types.js";

type ModelContextLike = {
  registerTool?: (tool: HostToolRegistration) => Disposable | void;
  unregisterTool?: (name: string) => void;
};

function readModelContext(): ModelContextLike | undefined {
  const nav = (globalThis as { navigator?: { modelContext?: ModelContextLike } })
    .navigator;
  if (nav?.modelContext?.registerTool) return nav.modelContext;
  const doc = (globalThis as { document?: { modelContext?: ModelContextLike } })
    .document;
  if (doc?.modelContext?.registerTool) return doc.modelContext;
  return undefined;
}

/** In-memory host used by tests and non-WebMCP environments. */
export class InMemoryWebMcpHost implements WebMcpHost {
  readonly tools = new Map<string, HostToolRegistration>();

  registerTool(tool: HostToolRegistration): Disposable {
    this.tools.set(tool.name, tool);
    return {
      dispose: () => {
        this.tools.delete(tool.name);
      },
    };
  }

  unregisterTool(name: string): void {
    this.tools.delete(name);
  }

  async invoke(name: string, input: unknown): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool not registered: ${name}`);
    return tool.execute(input);
  }

  listNames(): string[] {
    return [...this.tools.keys()].sort();
  }
}

export function createDefaultHost(): WebMcpHost {
  const ctx = readModelContext();
  if (ctx?.registerTool) {
    return {
      registerTool: (tool) => ctx.registerTool!(tool),
      unregisterTool: (name) => ctx.unregisterTool?.(name),
    };
  }
  return new InMemoryWebMcpHost();
}
