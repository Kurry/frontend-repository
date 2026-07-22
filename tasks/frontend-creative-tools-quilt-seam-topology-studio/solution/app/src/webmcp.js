const CONTRACT_VERSION = 'zto-webmcp-v1';
const MODULES = ['structured-editor-v1', 'entity-collection-v1', 'artifact-transfer-v1'];
const MODES = ['geometry', 'fabric', 'topology', 'assembly', 'proof'];
const ENTITY_TYPES = ['block', 'fabric-lot', 'assembly-group', 'variant-branch'];
const EXPORT_FORMATS = ['quilt-project-json', 'piece-manifest-csv', 'templates-svg', 'assembly-plan-json', 'maker-notes-md'];

const cleanId = value => String(value ?? '').trim();
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function initWebMCP(getState, dispatch, ui) {
  const handlers = {
    'editor.select': args => {
      const type = String(args.object_type ?? args.type ?? 'piece');
      const id = cleanId(args.id);
      const state = getState();
      const collection = type === 'piece' ? state.pieces : type === 'seam' ? state.seams : [];
      const selected = collection.find(item => item.id === id);
      if (!selected) return { ok: false, error: `unknown ${type}: ${id}` };
      ui.select(type, selected);
      return { ok: true, operation: 'select', object_type: type, id };
    },
    'editor.update_property': args => {
      const type = String(args.object_type ?? args.type ?? 'piece');
      const id = cleanId(args.id);
      const property = String(args.property ?? '');
      if (type === 'piece' && property === 'transform' && isObject(args.value)) {
        const allowed = Object.fromEntries(Object.entries(args.value).filter(([key, value]) => ['x', 'y', 'r'].includes(key) && Number.isFinite(Number(value))).map(([key, value]) => [key, Number(value)]));
        if (!Object.keys(allowed).length) return { ok: false, error: 'transform requires a numeric x, y, or r' };
        dispatch({ type: 'TRANSFORM_PIECE', pieceId: id, transform: allowed });
        return { ok: true, operation: 'update_property', object_type: type, id, property };
      }
      if (type === 'piece' && property === 'orientation') {
        const r = Number(args.value);
        if (!Number.isFinite(r)) return { ok: false, error: 'orientation must be numeric' };
        dispatch({ type: 'TRANSFORM_PIECE', pieceId: id, transform: { r } });
        return { ok: true, operation: 'update_property', object_type: type, id, property, value: r };
      }
      return { ok: false, error: `unsupported property ${property} for ${type}` };
    },
    'editor.switch_mode': args => {
      const mode = String(args.mode ?? 'fabric');
      if (!MODES.includes(mode)) return { ok: false, error: `unknown mode: ${mode}`, allowed: MODES };
      ui.switchMode(mode);
      return { ok: true, operation: 'switch_mode', mode };
    },
    'editor.preview': () => ({ ok: true, operation: 'preview', mode: ui.mode(), revision: getState().revisions }),
    'editor.set_content': args => {
      if (String(args.object_type ?? args.type ?? '') !== 'seam') return { ok: false, error: 'set_content supports seam objects only' };
      const id = cleanId(args.id);
      if (!getState().seams.some(seam => seam.id === id)) return { ok: false, error: `unknown seam: ${id}` };
      if (!isObject(args.content)) return { ok: false, error: 'content must be an object' };
      const changes = Object.fromEntries(Object.entries(args.content).filter(([key]) => ['family', 'completed'].includes(key)));
      if (!Object.keys(changes).length) return { ok: false, error: 'content requires family or completed' };
      dispatch({ type: 'UPDATE_SEAM', id, changes });
      return { ok: true, operation: 'set_content', object_type: 'seam', id };
    },
    'entity.create': args => {
      const entityType = String(args.entity_type ?? args.type ?? '');
      if (!ENTITY_TYPES.includes(entityType) || entityType === 'block') return { ok: false, error: `create is unsupported for ${entityType || 'unknown entity'}` };
      const id = cleanId(args.id) || `${entityType}-${Date.now()}`;
      const state = getState();
      const exists = entityType === 'fabric-lot' ? state.lots.some(item => item.id === id) : entityType === 'assembly-group' ? state.assemblyGroups.some(item => item.id === id) : Boolean(state.branches[id]);
      if (exists) return { ok: false, error: `${entityType} already exists: ${id}` };
      if (entityType === 'fabric-lot') dispatch({ type: 'CREATE_ENTITY', entityType, entity: { id, name: String(args.name ?? id), area: Math.max(1, Number(args.dimensions?.area ?? 10000)), used: 0, grain: 0, substitute: null } });
      if (entityType === 'assembly-group') dispatch({ type: 'CREATE_ENTITY', entityType, entity: { id, step: Math.max(0, Number(args.order ?? getState().assemblyGroups.length)), seams: [], dependencies: [], completed: false } });
      if (entityType === 'variant-branch') dispatch({ type: 'CREATE_ENTITY', entityType, entity: { id, name: String(args.name ?? id) } });
      return { ok: true, operation: 'create', entity_type: entityType, id };
    },
    'entity.select': args => {
      const entityType = String(args.entity_type ?? args.type ?? '');
      const id = cleanId(args.id);
      if (entityType === 'variant-branch' && getState().branches[id]) {
        dispatch({ type: 'SELECT_BRANCH', id });
        return { ok: true, operation: 'select', entity_type: entityType, id };
      }
      const collections = { block: getState().pieces.map(piece => piece.blockId), 'fabric-lot': getState().lots.map(lot => lot.id), 'assembly-group': getState().assemblyGroups.map(group => group.id) };
      return collections[entityType]?.includes(id) ? { ok: true, operation: 'select', entity_type: entityType, id } : { ok: false, error: `unknown ${entityType}: ${id}` };
    },
    'entity.update': args => {
      const entityType = String(args.entity_type ?? args.type ?? '');
      const id = cleanId(args.id);
      if (entityType !== 'fabric-lot' || !getState().lots.some(lot => lot.id === id)) return { ok: false, error: `update is unsupported for ${entityType}: ${id}` };
      const changes = {};
      if (args.material != null) changes.name = String(args.material).slice(0, 120);
      if (args.dimensions?.area != null && Number(args.dimensions.area) > 0) changes.area = Number(args.dimensions.area);
      if (!Object.keys(changes).length) return { ok: false, error: 'update requires material or dimensions.area' };
      dispatch({ type: 'UPDATE_LOT', id, changes });
      return { ok: true, operation: 'update', entity_type: entityType, id };
    },
    'entity.delete': args => {
      if (args.confirm !== true) return { ok: false, error: 'delete requires confirm=true' };
      const entityType = String(args.entity_type ?? args.type ?? '');
      const id = cleanId(args.id);
      if (!['fabric-lot', 'assembly-group', 'variant-branch'].includes(entityType)) return { ok: false, error: `delete is unsupported for ${entityType}` };
      const state = getState();
      const exists = entityType === 'fabric-lot' ? state.lots.some(item => item.id === id) : entityType === 'assembly-group' ? state.assemblyGroups.some(item => item.id === id) : Boolean(state.branches[id] && id !== 'main');
      if (!exists) return { ok: false, error: `unknown or protected ${entityType}: ${id}` };
      dispatch({ type: 'DELETE_ENTITY', entityType, id });
      return { ok: true, operation: 'delete', entity_type: entityType, id };
    },
    'entity.toggle': args => {
      const entityType = String(args.entity_type ?? args.type ?? '');
      const id = cleanId(args.id);
      if (entityType !== 'assembly-group') return { ok: false, error: 'toggle supports assembly-group only' };
      const group = getState().assemblyGroups.find(item => item.id === id);
      if (!group || !group.seams[0]) return { ok: false, error: `assembly group has no seam: ${id}` };
      dispatch({ type: group.completed ? 'UNPICK_JOIN' : 'COMPLETE_JOIN', seamId: group.seams[0] });
      return { ok: true, operation: 'toggle', entity_type: entityType, id, completed: !group.completed };
    },
    'artifact.export': args => {
      const format = String(args.format ?? 'quilt-project-json');
      if (!EXPORT_FORMATS.includes(format)) return { ok: false, error: `unknown export format: ${format}`, allowed: EXPORT_FORMATS };
      ui.exportArtifact(format);
      return { ok: true, operation: 'export', format, triggered: true, revision: getState().revisions };
    },
    'artifact.import': args => {
      const mode = String(args.mode ?? 'quilt-project-json');
      if (mode !== 'quilt-project-json') return { ok: false, error: `unknown import mode: ${mode}` };
      ui.openImport();
      return { ok: true, operation: 'import', mode, fileChooserOpened: true };
    },
    'artifact.copy': args => {
      const format = String(args.format ?? 'quilt-project-json');
      if (format !== 'quilt-project-json') return { ok: false, error: 'copy supports quilt-project-json only' };
      ui.copyProject();
      return { ok: true, operation: 'copy', format, copied: true, byteLength: JSON.stringify(getState()).length };
    },
  };

  const descriptions = {
    'editor.select': 'Select a piece or seam by id through the visible workspace selection path.',
    'editor.update_property': 'Update a selected piece transform or orientation through the reducer.',
    'editor.switch_mode': 'Switch among geometry, fabric, topology, assembly, and proof views.',
    'editor.preview': 'Report the currently visible mode and live project revision.',
    'editor.set_content': 'Update bounded seam content fields through the reducer.',
    'entity.create': 'Create a fabric lot, assembly group, or variant branch.',
    'entity.select': 'Select an existing block, fabric lot, assembly group, or variant branch.',
    'entity.update': 'Update bounded fabric-lot material or dimensions fields.',
    'entity.delete': 'Delete a supported entity; confirm=true is required.',
    'entity.toggle': 'Toggle an assembly group completion through the join command.',
    'artifact.export': 'Trigger a visible artifact download without returning artifact contents.',
    'artifact.import': 'Open the visible quilt-project JSON file picker.',
    'artifact.copy': 'Copy the live quilt-project JSON without returning clipboard contents.',
  };
  const tools = Object.keys(handlers).map(name => ({ name, description: descriptions[name] }));
  window.webmcp_session_info = () => ({ contract_version: CONTRACT_VERSION, modules: MODULES, tools: tools.map(tool => tool.name) });
  window.webmcp_list_tools = () => tools;
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const handler = handlers[name];
    if (!handler) return { ok: false, error: `unknown tool: ${name}` };
    try { return await handler(args || {}); } catch (error) { return { ok: false, error: String(error) }; }
  };
}
