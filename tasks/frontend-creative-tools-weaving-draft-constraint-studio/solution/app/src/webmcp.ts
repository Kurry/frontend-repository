import { Dispatch } from 'react';
import { Action } from './store';
import { WeavingDraftProject, YarnColor } from './types';
import { exportCSV, exportSVG, exportSessionJSON, generateWIF } from './artifacts';

type Args = Record<string, unknown>;

declare global {
  interface Window {
    webmcp_session_info: () => unknown;
    webmcp_list_tools: () => unknown;
    webmcp_invoke_tool: (toolName: string, args?: Args) => Promise<unknown>;
  }
}

const modules = ['entity-collection-v1', 'structured-editor-v1', 'command-session-v1', 'artifact-transfer-v1'];
const tools = [
  { name: 'entity.create', module: modules[0], description: 'Fork a named draft variant.', inputSchema: { type: 'object', additionalProperties: false, properties: { fields: { type: 'object', additionalProperties: { type: 'string' } } } } },
  { name: 'entity.select', module: modules[0], description: 'Select a variant by public id.', inputSchema: { type: 'object', additionalProperties: false, required: ['id'], properties: { id: { type: 'string' } } } },
  { name: 'entity.update', module: modules[0], description: 'Merge or rename a declared variant.', inputSchema: { type: 'object', additionalProperties: false, required: ['id', 'fields'], properties: { id: { type: 'string' }, fields: { type: 'object', additionalProperties: { type: 'string' } } } } },
  { name: 'entity.toggle', module: modules[0], description: 'Toggle the bounded draft approval state.', inputSchema: { type: 'object', additionalProperties: false, required: ['id'], properties: { id: { type: 'string' }, field: { type: 'string' } } } },
  { name: 'editor.select', module: modules[1], description: 'Select a bounded grid cell or repeat range.', inputSchema: { type: 'object', additionalProperties: false, required: ['id'], properties: { id: { type: 'string' } } } },
  { name: 'editor.update_property', module: modules[1], description: 'Update a declared grid or color property.', inputSchema: { type: 'object', additionalProperties: false, required: ['id', 'property', 'value'], properties: { id: { type: 'string' }, property: { type: 'string' }, value: { type: 'string' } } } },
  { name: 'editor.set_content', module: modules[1], description: 'Set a bounded numeric threading or treadling sequence.', inputSchema: { type: 'object', additionalProperties: false, required: ['id', 'content'], properties: { id: { type: 'string' }, content: { type: 'string' } } } },
  { name: 'editor.switch_mode', module: modules[1], description: 'Switch to a declared studio mode.', inputSchema: { type: 'object', additionalProperties: false, required: ['mode'], properties: { mode: { type: 'string', enum: ['paint', 'erase', 'threading', 'tie-up', 'treadling', 'colors', 'repeat', 'analysis', 'variants', 'simulation', 'artifacts'] } } } },
  { name: 'editor.preview', module: modules[1], description: 'Read the current bounded draft summary.', inputSchema: { type: 'object', additionalProperties: false, properties: {} } },
  { name: 'session.start', module: modules[2], description: 'Start weaving simulation at the first pick.', inputSchema: { type: 'object', additionalProperties: false, properties: {} } },
  { name: 'session.restart', module: modules[2], description: 'Restart simulation from the imported draft.', inputSchema: { type: 'object', additionalProperties: false, properties: {} } },
  { name: 'session.advance', module: modules[2], description: 'Advance the simulation by one pick.', inputSchema: { type: 'object', additionalProperties: false, properties: {} } },
  { name: 'session.trigger_demo', module: modules[2], description: 'Trigger a declared weaving recovery fixture.', inputSchema: { type: 'object', additionalProperties: false, required: ['demo'], properties: { demo: { type: 'string', enum: ['wrong-treadle', 'wrong-color', 'broken-yarn', 'branch-at-error'] } } } },
  { name: 'artifact.export', module: modules[3], description: 'Export a declared current-draft format.', inputSchema: { type: 'object', additionalProperties: false, required: ['format'], properties: { format: { type: 'string', enum: ['canonical-json', 'wif-ini', 'draft-svg', 'drawdown-svg', 'yarn-pick-ledger-csv'] } } } },
  { name: 'artifact.import', module: modules[3], description: 'Start canonical JSON or WIF import.', inputSchema: { type: 'object', additionalProperties: false, required: ['mode'], properties: { mode: { type: 'string', enum: ['canonical-json', 'wif-ini'] } } } },
  { name: 'artifact.copy', module: modules[3], description: 'Return the canonical draft text used by the visible copy workflow.', inputSchema: { type: 'object', additionalProperties: false, properties: {} } },
];

export function initWebMCP(dispatch: Dispatch<Action>, getState: () => WeavingDraftProject) {
  const invoke = async (toolName: string, args: Args = {}) => {
    const state = getState();
    if (toolName === 'entity.create') {
      const fields = (args.fields || {}) as Record<string, string>;
      const name = fields.name || 'WebMCP Variant';
      dispatch({ type: 'BRANCH_VARIANT', name });
      return { ok: true, operation: 'create', status: 'variant_forked', name };
    }
    if (toolName === 'entity.select') {
      const id = String(args.id || '');
      if (!state.variants.some(variant => variant.id === id)) return { ok: false, error: `Unknown variant: ${id}` };
      dispatch({ type: 'SWITCH_VARIANT', id });
      return { ok: true, operation: 'select', public_ids: [id] };
    }
    if (toolName === 'entity.update') {
      const id = String(args.id || '');
      if (!state.variants.some(variant => variant.id === id)) return { ok: false, error: `Unknown variant: ${id}` };
      dispatch({ type: 'MERGE_VARIANT', id });
      return { ok: true, operation: 'update', public_ids: [id], status: 'merged' };
    }
    if (toolName === 'entity.toggle') {
      dispatch({ type: 'APPROVE_DRAFT' });
      return { ok: true, operation: 'toggle', status: 'approved' };
    }
    if (toolName === 'editor.select') return { ok: true, operation: 'select', public_ids: [String(args.id || '')] };
    if (toolName === 'editor.update_property') {
      const id = String(args.id || '');
      const [grid, rawIndex = '0'] = id.split(':');
      const index = Number(rawIndex);
      const property = String(args.property || '');
      const value = String(args.value || '');
      if (!Number.isInteger(index) || index < 0) return { ok: false, error: 'Cell id must be grid:index' };
      if (grid === 'threading' && property === 'shaft') dispatch({ type: 'SET_THREADING', index, shaft: Number(value) as 0 | 1 | 2 | 3 });
      else if (grid === 'treadling' && property === 'treadle') dispatch({ type: 'SET_TREADLING', index, treadle: Number(value) as 0 | 1 | 2 | 3 });
      else if (grid === 'warp' && property === 'color-id') dispatch({ type: 'SET_WARP_COLOR', index, color: value as YarnColor });
      else if (grid === 'weft' && property === 'color-id') dispatch({ type: 'SET_WEFT_COLOR', index, color: value as YarnColor });
      else return { ok: false, error: `Unsupported property ${property} for ${grid}` };
      return { ok: true, operation: 'update_property', public_ids: [id] };
    }
    if (toolName === 'editor.set_content') {
      const grid = String(args.id || '');
      const values = String(args.content || '').split(/[\s,]+/).filter(Boolean).map(Number);
      if (!values.length || values.some(value => !Number.isInteger(value) || value < 0 || value > 3)) return { ok: false, error: 'Sequence values must be integer shaft/treadle indices 0-3' };
      values.forEach((value, index) => dispatch(grid === 'threading' ? { type: 'SET_THREADING', index, shaft: value as 0 | 1 | 2 | 3 } : { type: 'SET_TREADLING', index, treadle: value as 0 | 1 | 2 | 3 }));
      return { ok: true, operation: 'set_content', count: values.length };
    }
    if (toolName === 'editor.switch_mode') return { ok: true, operation: 'switch_mode', mode: args.mode };
    if (toolName === 'editor.preview') return { ok: true, operation: 'preview', ends: state.dimensions.ends, picks: state.dimensions.picks, variants: state.variants.length, currentPick: state.simulation?.currentPick || 0 };
    if (toolName === 'session.start' || toolName === 'session.advance') {
      dispatch({ type: 'SIMULATE_PICK' });
      return { ok: true, operation: toolName.split('.')[1], currentPick: (state.simulation?.currentPick || 0) + 1 };
    }
    if (toolName === 'session.restart') {
      dispatch({ type: 'IMPORT_STATE', state: { ...state, simulation: null } });
      return { ok: true, operation: 'restart', currentPick: 0 };
    }
    if (toolName === 'session.trigger_demo') {
      const demo = String(args.demo || '');
      if (demo === 'branch-at-error') dispatch({ type: 'BRANCH_VARIANT', name: 'Error recovery branch' });
      else dispatch({ type: 'SIMULATE_ERROR', errorType: demo.replaceAll('-', '_') as 'wrong_treadle' | 'wrong_color' | 'broken_yarn' });
      return { ok: true, operation: 'trigger_demo', demo };
    }
    if (toolName === 'artifact.export' || toolName === 'artifact.copy') {
      const format = toolName === 'artifact.copy' ? 'canonical-json' : String(args.format || '');
      const artifact = format === 'canonical-json' ? exportSessionJSON(state) : format === 'wif-ini' ? generateWIF(state) : format.includes('svg') ? exportSVG(state) : exportCSV(state);
      return { ok: true, operation: toolName.split('.')[1], format, artifact };
    }
    if (toolName === 'artifact.import') return { ok: true, operation: 'import', mode: args.mode, completed: false, status: 'file_picker_required' };
    return { ok: false, error: `Unknown tool: ${toolName}` };
  };

  window.webmcp_session_info = () => ({ contract_version: 'zto-webmcp-v1', modules, tools: tools.map(tool => tool.name) });
  window.webmcp_list_tools = () => tools;
  window.webmcp_invoke_tool = invoke;
}
