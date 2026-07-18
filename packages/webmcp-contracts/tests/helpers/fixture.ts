import {
  compileModules,
  createContractRuntime,
  InMemoryWebMcpHost,
  type ModuleHandlersById,
  type ModuleId,
} from "../../src/index.js";

export function createFixtureRuntime(
  modules: ModuleId[],
  bindings: Record<string, unknown>,
  handlers: Partial<ModuleHandlersById> = {},
) {
  const host = new InMemoryWebMcpHost();
  const runtime = createContractRuntime({ host });
  const tools = compileModules(modules, bindings, handlers);
  const disposable = runtime.register("fixture", tools);
  return { host, runtime, tools, disposable };
}
