export { CONTRACT_VERSION, MODULE_IDS, MIN_MODULES, MAX_MODULES } from "./constants.js";
export type { ModuleId } from "./constants.js";

export {
  BindingValidationError,
  InputValidationError,
  EpochMismatchError,
  RegistrationError,
  AbortedError,
  WebMcpContractError,
} from "./errors.js";

export type {
  JsonSchema,
  ToolAnnotations,
  Acknowledgement,
  InvokeContext,
  ToolExecute,
  CompiledTool,
  Disposable,
  HostToolRegistration,
  WebMcpHost,
  AssignmentMapEntry,
  ValueBounds,
  ModuleFactory,
  ContractMountOptions,
} from "./types.js";

export {
  MODULE_FACTORIES,
  compileModules,
  browseQueryV1,
  entityCollectionV1,
  formWorkflowV1,
  structuredEditorV1,
  commandSessionV1,
  artifactTransferV1,
} from "./modules/index.js";
export type { ModuleHandlersById } from "./modules/index.js";

export {
  ContractRuntime,
  createContractRuntime,
} from "./runtime/contract-runtime.js";
export type { ContractRuntimeOptions } from "./runtime/contract-runtime.js";
export { InMemoryWebMcpHost, createDefaultHost } from "./runtime/host.js";
export { NavigationEpochClock } from "./runtime/epochs.js";
export { ToolRegistry } from "./runtime/registry.js";

export {
  validateAssignmentEntry,
  validateAssignmentMap,
  contractVersion,
  isModuleId,
} from "./assignment/validate.js";
