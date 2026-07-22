// Read-only WebMCP tool probe: synthesize arguments from a tool's input schema
// and confirm the bridge round-trips (list -> invoke -> structured response).
// Extracted from oracle_ci_runtime.mjs so the probe loop is unit-testable with a
// fake `invoke`; the runtime imports these helpers so its behavior is unchanged.
import { isErrorResult } from './oracle_ci_semantics.mjs';

export function toolSchema(tool) {
  return tool.inputSchema || tool.input_schema || tool.parameters || { type: 'object' };
}

// Synthesize a schema-valid argument value. `lenient` only affects required
// strings with no keyword hint: mutation probes keep the strict default
// (undefined => skip the tool), while read-only probes fall back to a generic
// probe string because they are safe to invoke and cannot guess app-specific ids.
export function valueForSchema(schema, key = '', depth = 0, lenient = false) {
  if (!schema || typeof schema !== 'object' || depth > 5) return undefined;
  if ('const' in schema) return schema.const;
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  if ('default' in schema) return schema.default;
  const type = Array.isArray(schema.type) ? schema.type.find((item) => item !== 'null') : schema.type;
  if (type === 'object' || schema.properties) {
    const result = {};
    for (const required of schema.required || []) {
      const value = valueForSchema(schema.properties?.[required] || {}, required, depth + 1, lenient);
      if (value === undefined) return undefined;
      result[required] = value;
    }
    return result;
  }
  if (type === 'array') {
    const item = valueForSchema(schema.items || {}, key, depth + 1, lenient);
    return item === undefined ? [] : [item];
  }
  if (type === 'boolean') return true;
  if (type === 'integer' || type === 'number') return schema.minimum ?? schema.min ?? 1;
  if (type === 'string' || !type) {
    if (/query|search|name|title|note|text|content|reason/i.test(key)) return 'oracle-ci';
    return lenient ? 'oracle-ci' : undefined;
  }
  return undefined;
}

export function isReadOnly(tool) {
  if (tool.annotations?.readOnlyHint === true) return true;
  return /(?:^|[._])(search|validate|select)$/.test(String(tool.name || ''));
}

// A contract-shaped error envelope: a plain object carrying an explicit
// success flag (`ok`/`success`). Such a response proves the list->invoke->
// structured-response round-trip even when the value is an error, so it counts
// as a degraded round-trip. Nulls, primitives, and objects lacking a success
// flag are malformed and never qualify.
export function isWellFormedErrorEnvelope(result) {
  return (
    result !== null &&
    typeof result === 'object' &&
    !Array.isArray(result) &&
    ('ok' in result || 'success' in result)
  );
}

// Probe every read-only tool until one round-trips. Returns
// { readProbe, warning?, failures } — readProbe is null only when no candidate
// produced a success result or a well-formed error envelope. `invoke(name,args)`
// is the caller's tool-invocation adapter (the live page in the runtime, a fake
// in tests).
export async function runReadProbe(tools, invoke) {
  const candidates = tools
    .filter(isReadOnly)
    .map((tool) => ({ tool, args: valueForSchema(toolSchema(tool), '', 0, true) }))
    .filter(({ args }) => args !== undefined);
  const failures = [];
  let degraded = null;
  for (const candidate of candidates) {
    try {
      const result = await invoke(candidate.tool.name, candidate.args);
      if (!isErrorResult(result)) {
        return { readProbe: candidate.tool.name, failures };
      }
      if (!degraded && isWellFormedErrorEnvelope(result)) degraded = candidate.tool.name;
      failures.push(`${candidate.tool.name}: error result`);
    } catch (error) {
      failures.push(`${candidate.tool.name}: ${error.message}`);
    }
  }
  if (degraded) {
    return {
      readProbe: degraded,
      warning: `read probe round-tripped via error envelope from ${degraded}; no synthesizable success path`,
      failures,
    };
  }
  return { readProbe: null, failures };
}
