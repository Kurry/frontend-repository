import { game, gameState, STAGES, MASK_DEFS } from './game-store.svelte.ts';

const CONTRACT_VERSION = 'zto-webmcp-v1';
const MODULES = ['command-session-v1', 'browse-query-v1', 'entity-collection-v1', 'artifact-transfer-v1'];
const DESTINATIONS = ['stage-map', 'masks', 'cantina', 'export-campaign', 'import-campaign'] as const;
const MASK_IDS = MASK_DEFS.map((mask) => mask.id);

type Result = Record<string, unknown>;
type Handler = (args: Result) => Result;

export interface NavBridge {
  sessionPause: () => void;
  sessionResume: () => void;
  currentScreen: () => string;
  startStage: (stageId: number) => void;
  restartStage: () => void;
  continueFromVictory: () => void;
  retreatToMap: () => void;
  openMap: () => void;
  openMasks: () => void;
  openCantina: () => void;
  openExportCampaign: () => void;
  openImportCampaign: () => void;
}

let nav: NavBridge | null = null;

function screen() {
  return nav?.currentScreen() ?? 'unavailable';
}

function focusControl(id: string) {
  setTimeout(() => document.getElementById(id)?.focus(), 0);
}

function sessionStart({ stageId }: Result): Result {
  if (typeof stageId !== 'number' || !Number.isInteger(stageId) || stageId < 1 || stageId > STAGES.length) {
    return { ok: false, error: `stageId must be an integer from 1 to ${STAGES.length}` };
  }
  const stage = stageId;
  if (screen() !== 'MAP') return { ok: false, error: 'start is only available from the stage map' };
  if (!gameState.unlockedStages.includes(stage)) return { ok: false, error: `stage ${stage} is locked` };
  nav?.startStage(stage);
  return { ok: true, operation: 'start', stageId: stage, screen: screen() };
}

function sessionPause(): Result {
  if (!['COMBAT', 'BOSS'].includes(screen())) {
    return { ok: false, error: 'pause is only available during combat' };
  }
  nav?.sessionPause();
  return { ok: true, operation: 'pause', screen: screen() };
}

function sessionResume(): Result {
  if (screen() !== 'PAUSE') return { ok: false, error: 'resume is only available from the pause overlay' };
  nav?.sessionResume();
  return { ok: true, operation: 'resume', screen: screen() };
}

function sessionRestart(): Result {
  if (screen() !== 'DEFEAT') return { ok: false, error: 'restart is only available from Derrota' };
  nav?.restartStage();
  return { ok: true, operation: 'restart', stageId: gameState.currentStage, screen: screen() };
}

function sessionAdvance(): Result {
  if (screen() !== 'VICTORY') return { ok: false, error: 'advance is only available from Victory' };
  nav?.continueFromVictory();
  return { ok: true, operation: 'advance', screen: screen() };
}

function sessionStop(): Result {
  if (['COMBAT', 'BOSS'].includes(screen())) nav?.retreatToMap();
  if (screen() !== 'PAUSE') {
    return { ok: false, error: 'stop is only available during combat or from the pause overlay' };
  }
  return {
    ok: true,
    operation: 'stop',
    screen: screen(),
    confirmationRequired: true,
    visibleControl: 'Abandon Run',
  };
}

function browseOpen({ destination }: Result): Result {
  if (!DESTINATIONS.includes(destination as (typeof DESTINATIONS)[number])) {
    return { ok: false, error: `destination must be one of ${DESTINATIONS.join(', ')}` };
  }
  if (destination === 'stage-map') {
    nav?.openMap();
    return screen() === 'MAP'
      ? { ok: true, operation: 'open', destination, screen: screen() }
      : { ok: false, error: 'stage-map cannot be opened from the current run state' };
  }
  if (screen() !== 'MAP') {
    return { ok: false, error: `${destination} is available from the stage map` };
  }
  if (destination === 'masks') nav?.openMasks();
  else if (destination === 'cantina') nav?.openCantina();
  else if (destination === 'export-campaign') nav?.openExportCampaign();
  else nav?.openImportCampaign();
  return { ok: true, operation: 'open', destination, screen: screen() };
}

function maskView(id: string) {
  const definition = MASK_DEFS.find((mask) => mask.id === id);
  if (!definition) return null;
  return {
    id: definition.id,
    name: definition.name,
    bonus: definition.bonus,
    equipped: gameState.equippedMask === definition.id,
    owned: gameState.ownedMasks.includes(definition.id),
  };
}

function requireOwnedMask(id: string): { mask: NonNullable<ReturnType<typeof maskView>> | null; error?: string } {
  const mask = maskView(id);
  if (!mask) return { mask: null, error: `unknown mask: ${id}` };
  if (!mask.owned) return { mask: null, error: `mask ${id} is locked; defeat its stage boss to unlock it` };
  return { mask };
}

function entitySelect({ entity, id }: Result): Result {
  if (entity !== 'mask') return { ok: false, error: 'entity must be mask' };
  if (typeof id !== 'string') return { ok: false, error: 'id must be a declared mask id' };
  const found = requireOwnedMask(id);
  if (!found.mask) return { ok: false, error: found.error };
  game.equipMask(found.mask.id);
  return { ok: true, operation: 'select', entity: maskView(found.mask.id) };
}

function entityToggle({ entity, id }: Result): Result {
  if (entity !== 'mask') return { ok: false, error: 'entity must be mask' };
  if (typeof id !== 'string') return { ok: false, error: 'id must be a declared mask id' };
  const found = requireOwnedMask(id);
  if (!found.mask) return { ok: false, error: found.error };
  game.equipMask(found.mask.equipped ? null : found.mask.id);
  return { ok: true, operation: 'toggle', entity: maskView(found.mask.id) };
}

function artifactExport({ format }: Result): Result {
  if (format !== 'campaign-json') return { ok: false, error: 'format must be campaign-json' };
  if (screen() === 'MAP') nav?.openExportCampaign();
  if (screen() !== 'EXPORT') return { ok: false, error: 'export is available from the stage map' };
  return { ok: true, operation: 'export', format, previewVisible: true };
}

function artifactImport({ mode }: Result): Result {
  if (mode !== 'campaign-json') return { ok: false, error: 'mode must be campaign-json' };
  if (screen() === 'MAP') nav?.openImportCampaign();
  if (screen() !== 'IMPORT') return { ok: false, error: 'import is available from the stage map' };
  focusControl('campaign-json-input');
  return { ok: true, operation: 'import', mode, importSurfaceVisible: true };
}

function artifactCopy({ format }: Result): Result {
  const opened = artifactExport({ format });
  if (opened.ok !== true) return opened;
  focusControl('campaign-export-copy');
  return { ok: true, operation: 'copy', format, copyControlVisible: true };
}

const emptySchema = { type: 'object', properties: {}, additionalProperties: false };
const TOOLS: { name: string; description: string; inputSchema: Result; handler: Handler }[] = [
  { name: 'session_start', description: 'Start an unlocked stage from the visible Stage Select map.', inputSchema: { type: 'object', properties: { stageId: { type: 'integer', minimum: 1, maximum: 3 } }, required: ['stageId'], additionalProperties: false }, handler: sessionStart },
  { name: 'session_pause', description: 'Pause an active combat run through the visible pause command.', inputSchema: emptySchema, handler: sessionPause },
  { name: 'session_resume', description: 'Resume the exact run frozen behind the visible pause overlay.', inputSchema: emptySchema, handler: sessionResume },
  { name: 'session_restart', description: 'Restart the current stage from the visible Derrota control.', inputSchema: emptySchema, handler: sessionRestart },
  { name: 'session_advance', description: 'Continue from Victory to the visible Stage Select map.', inputSchema: emptySchema, handler: sessionAdvance },
  { name: 'session_stop', description: 'Open the visible Pause overlay and expose its confirmation-guarded Abandon Run control.', inputSchema: emptySchema, handler: sessionStop },
  { name: 'browse_open', description: 'Open one declared FandangoFury destination through its visible navigation command.', inputSchema: { type: 'object', properties: { destination: { type: 'string', enum: DESTINATIONS } }, required: ['destination'], additionalProperties: false }, handler: browseOpen },
  { name: 'entity_select', description: 'Equip one owned mask through the same command as its visible Equip control.', inputSchema: { type: 'object', properties: { entity: { const: 'mask' }, id: { type: 'string', enum: MASK_IDS } }, required: ['entity', 'id'], additionalProperties: false }, handler: entitySelect },
  { name: 'entity_toggle', description: 'Toggle one owned mask through the visible Equip or Unequip command.', inputSchema: { type: 'object', properties: { entity: { const: 'mask' }, id: { type: 'string', enum: MASK_IDS } }, required: ['entity', 'id'], additionalProperties: false }, handler: entityToggle },
  { name: 'artifact_export', description: 'Open the live Campaign JSON preview without returning artifact contents.', inputSchema: { type: 'object', properties: { format: { const: 'campaign-json' } }, required: ['format'], additionalProperties: false }, handler: artifactExport },
  { name: 'artifact_import', description: 'Open and focus the visible Campaign JSON import surface; payload entry stays browser-driven.', inputSchema: { type: 'object', properties: { mode: { const: 'campaign-json' } }, required: ['mode'], additionalProperties: false }, handler: artifactImport },
  { name: 'artifact_copy', description: 'Open the Campaign JSON preview and focus Copy; clipboard interaction stays browser-driven.', inputSchema: { type: 'object', properties: { format: { const: 'campaign-json' } }, required: ['format'], additionalProperties: false }, handler: artifactCopy },
];

export function initWebMcp(bridge: NavBridge) {
  nav = bridge;
  const target = window as unknown as Record<string, unknown>;
  target.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: MODULES,
    tools: TOOLS.map((tool) => tool.name),
    bindings: {
      session_operations: ['start', 'pause', 'resume', 'restart', 'advance', 'stop'],
      destinations: DESTINATIONS,
      entity: 'mask',
      entity_operations: ['select', 'toggle'],
      entity_fields: ['name', 'bonus', 'equipped'],
      artifact_operations: ['export', 'import', 'copy'],
      export_formats: ['campaign-json'],
      import_modes: ['campaign-json'],
    },
  });
  target.webmcp_list_tools = () => TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
  target.webmcp_invoke_tool = (name: string, args: Result = {}) => {
    const tool = TOOLS.find((candidate) => candidate.name === name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try {
      return tool.handler(args || {});
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  };
  target.webmcp = {
    sessionInfo: target.webmcp_session_info,
    listTools: target.webmcp_list_tools,
    invokeTool: target.webmcp_invoke_tool,
  };
}
