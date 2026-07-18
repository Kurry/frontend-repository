import type { ModuleId } from "./constants.js";

export type JsonSchema = Record<string, unknown>;

export type ToolAnnotations = {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  openWorldHint?: boolean;
  /** Page-provided tool output is always untrusted evidence. */
  untrustedOutput: true;
};

export type Acknowledgement = {
  ok: boolean;
  /** Short status token, never proof of visible success. */
  status: string;
  /** Public identifiers already visible in the product UI. */
  public_ids?: string[];
  /** Optional bounded message for diagnostics. */
  message?: string;
  navigation_epoch: number;
};

export type InvokeContext = {
  signal: AbortSignal;
  navigationEpoch: number;
  scopeId: string;
  toolName: string;
};

export type ToolExecute = (
  input: Record<string, unknown>,
  ctx: InvokeContext,
) => Promise<Acknowledgement> | Acknowledgement;

export type CompiledTool = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  annotations: ToolAnnotations;
  execute: ToolExecute;
  moduleId: ModuleId;
};

export type Disposable = {
  dispose: () => void;
};

export type HostToolRegistration = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  annotations: ToolAnnotations;
  execute: (input: unknown) => Promise<unknown>;
};

/** Injected host; never owns product state. */
export type WebMcpHost = {
  registerTool: (tool: HostToolRegistration) => Disposable | void;
  unregisterTool?: (name: string) => void;
};

export type AssignmentMapEntry = {
  task: string;
  modules: ModuleId[];
  bindings: Record<string, unknown>;
  mechanics_exclusions: string[];
};

export type ValueBounds = {
  min?: number;
  max?: number;
  maxLength?: number;
};

export type ModuleFactory<B, H> = {
  id: ModuleId;
  validateBindings: (bindings: unknown) => B;
  compile: (bindings: B, handlers: H) => CompiledTool[];
};

export type ContractMountOptions = {
  scopeId: string;
  modules: CompiledTool[] | (() => CompiledTool[]);
};
