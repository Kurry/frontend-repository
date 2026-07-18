export const CONTRACT_VERSION = "zto-webmcp-v1" as const;

export const MODULE_IDS = [
  "browse-query-v1",
  "entity-collection-v1",
  "form-workflow-v1",
  "structured-editor-v1",
  "command-session-v1",
  "artifact-transfer-v1",
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

export const MIN_MODULES = 1;
export const MAX_MODULES = 4;

export const OUTPUT_LIMITS = {
  maxStringLength: 200,
  maxArrayLength: 20,
  maxObjectKeys: 16,
  maxDepth: 3,
  maxTotalChars: 1200,
} as const;

export const FORBIDDEN_OUTPUT_PATTERNS: readonly RegExp[] = [
  /\bcriterion\b/i,
  /\brubric\b/i,
  /\breward\b/i,
  /\bpass\b/i,
  /\bfail\b/i,
  /\bjudge\b/i,
  /\bverifier\b/i,
  /\bhidden\s*test\b/i,
  /\bsolution\b/i,
  /\bexpected\s*answer\b/i,
];

export const FORBIDDEN_INPUT_KEYS = [
  "selector",
  "css",
  "xpath",
  "url",
  "href",
  "path",
  "filePath",
  "filepath",
  "blob",
  "base64",
  "contentBase64",
  "raw",
  "javascript",
  "script",
  "patch",
  "setState",
  "getState",
  "execute",
  "eval",
] as const;
