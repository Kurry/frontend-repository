import {
  store,
  setView,
  setTheme,
  createIdentity,
  selectIdentity,
  toggleAppPermission,
  renameIdentity,
  deleteIdentity,
  importVault,
  importBackup,
  setSearchQuery,
  setSortOrder,
  setAuditFilter,
  setVaultDrawerOpen,
  exportVaultJson,
  exportBackupJson,
  APPS,
  ViewId,
  AuditActionType,
} from './store';

type ToolHandler = (args: Record<string, unknown>) => unknown;

interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: ToolHandler;
}

const DESTINATIONS: ViewId[] = ['dashboard', 'identities', 'permissions', 'audit-log', 'settings'];
const ALL_DESTINATIONS = [...DESTINATIONS, 'export-drawer'];
const THEMES = ['light', 'dark'];
const APP_IDS = APPS.map((a) => a.id);
const AUDIT_FILTERS: AuditActionType[] = [
  'all',
  'identity-created',
  'identity-renamed',
  'identity-deleted',
  'identity-selected',
  'permission-changed',
  'bulk-permission',
  'key-rotated',
  'backup-exported',
  'backup-imported',
  'vault-exported',
  'vault-imported',
  'theme-changed',
];

const tools: ToolDef[] = [
  {
    name: 'browse_open',
    description: 'Navigate the vault to a named destination view.',
    parameters: {
      type: 'object',
      properties: { destination: { type: 'string', enum: ALL_DESTINATIONS } },
      required: ['destination'],
    },
    handler: (args) => {
      const destination = String(args.destination ?? '');
      if (!ALL_DESTINATIONS.includes(destination as ViewId | 'export-drawer')) {
        throw new Error(`Unknown destination: ${destination}`);
      }
      if (destination === 'export-drawer') {
        setVaultDrawerOpen(true);
        return { drawerOpened: true };
      }
      setView(destination as ViewId);
      return { view: store.view };
    },
  },
  {
    name: 'browse_search',
    description: 'Search identities.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
    handler: (args) => {
      setSearchQuery(String(args.query ?? ''));
      return { query: store.searchQuery };
    },
  },
  {
    name: 'browse_sort',
    description: 'Sort identities.',
    parameters: {
      type: 'object',
      properties: { sorts: { type: 'string', enum: ['label-asc', 'label-desc'] } },
      required: ['sorts'],
    },
    handler: (args) => {
      const sorts = String(args.sorts ?? '');
      if (!['label-asc', 'label-desc'].includes(sorts)) throw new Error(`Unknown sort: ${sorts}`);
      setSortOrder(sorts as 'label-asc' | 'label-desc');
      return { sortOrder: store.sortOrder };
    },
  },
  {
    name: 'browse_apply_filter',
    description: 'Apply an audit log action-type filter.',
    parameters: {
      type: 'object',
      properties: { filter: { type: 'string', enum: AUDIT_FILTERS } },
      required: ['filter'],
    },
    handler: (args) => {
      const filter = String(args.filter ?? 'all') as AuditActionType;
      setAuditFilter(filter);
      return { auditFilter: store.auditFilter };
    },
  },
  {
    name: 'browse_set_theme',
    description: 'Switch the vault appearance between light and dark theme.',
    parameters: {
      type: 'object',
      properties: { theme: { type: 'string', enum: THEMES } },
      required: ['theme'],
    },
    handler: (args) => {
      const theme = String(args.theme ?? '');
      if (!THEMES.includes(theme)) throw new Error(`Unknown theme: ${theme}`);
      setTheme(theme as 'light' | 'dark');
      return { theme: store.theme };
    },
  },
  {
    name: 'entity_identity_create',
    description: 'Create a new Nostr identity with a generated keypair and switch to it.',
    parameters: {
      type: 'object',
      properties: { label: { type: 'string' } },
      required: ['label'],
    },
    handler: (args) => {
      const id = createIdentity(String(args.label ?? ''));
      const identity = store.identities.find((i) => i.id === id);
      return { id, nickname: identity?.nickname, npub: identity?.npub };
    },
  },
  {
    name: 'entity_identity_select',
    description: 'Select an existing identity as the active identity.',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
    handler: (args) => {
      const id = String(args.id ?? '');
      if (!store.identities.some((i) => i.id === id)) throw new Error(`Unknown identity id: ${id}`);
      selectIdentity(id);
      return { activeIdentityId: store.activeIdentityId };
    },
  },
  {
    name: 'entity_identity_update',
    description: 'Update identity label.',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string' }, label: { type: 'string' } },
      required: ['id', 'label'],
    },
    handler: (args) => {
      const id = String(args.id ?? '');
      if (!store.identities.some((i) => i.id === id)) throw new Error(`Unknown identity id: ${id}`);
      renameIdentity(id, String(args.label ?? ''));
      return { success: true };
    },
  },
  {
    name: 'entity_identity_delete',
    description: 'Delete an identity.',
    parameters: {
      type: 'object',
      properties: { id: { type: 'string' }, confirm: { type: 'boolean' } },
      required: ['id', 'confirm'],
    },
    handler: (args) => {
      if (!args.confirm) throw new Error('Delete requires explicit confirm=true.');
      const id = String(args.id ?? '');
      if (!store.identities.some((i) => i.id === id)) throw new Error(`Unknown identity id: ${id}`);
      deleteIdentity(id);
      return { success: true };
    },
  },
  {
    name: 'entity_identity_toggle',
    description: "Toggle an application's permission grant for a given identity.",
    parameters: {
      type: 'object',
      properties: {
        identityId: { type: 'string' },
        appId: { type: 'string', enum: APP_IDS },
      },
      required: ['identityId', 'appId'],
    },
    handler: (args) => {
      const identityId = String(args.identityId ?? '');
      const appId = String(args.appId ?? '');
      if (!store.identities.some((i) => i.id === identityId)) throw new Error(`Unknown identity id: ${identityId}`);
      if (!APP_IDS.includes(appId as (typeof APP_IDS)[number])) throw new Error(`Unknown app id: ${appId}`);
      toggleAppPermission(identityId, appId as (typeof APP_IDS)[number]);
      return { granted: store.grants[identityId]?.[appId as (typeof APP_IDS)[number]] ?? false };
    },
  },
  {
    name: 'artifact_export',
    description: 'Export vault or backup JSON preview metadata.',
    parameters: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['json', 'backup-json'] },
        identityId: { type: 'string' },
      },
      required: ['format'],
    },
    handler: (args) => {
      const format = String(args.format ?? 'json');
      if (format === 'json') {
        return { preview: exportVaultJson(), surface: 'vault-json' };
      }
      if (format === 'backup-json') {
        const identityId = String(args.identityId ?? store.activeIdentityId);
        const preview = exportBackupJson(identityId);
        if (!preview) throw new Error(`Unknown identity id: ${identityId}`);
        return { preview, surface: 'backup-json', identityId };
      }
      throw new Error(`Unknown export format: ${format}`);
    },
  },
  {
    name: 'artifact_import',
    description: 'Import vault or backup JSON.',
    parameters: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['vault-json', 'backup-json'] },
        vaultData: { type: 'object' },
        backupData: { type: 'object' },
      },
      required: ['mode'],
    },
    handler: (args) => {
      const mode = String(args.mode ?? '');
      if (mode === 'vault-json') {
        const result = importVault(args.vaultData);
        if (!result.ok) throw new Error(result.error);
        return { success: true, surface: 'vault-json' };
      }
      if (mode === 'backup-json') {
        const result = importBackup(args.backupData);
        if (!result.ok) throw new Error(result.error);
        return { success: true, surface: 'backup-json' };
      }
      throw new Error(`Unknown import mode: ${mode}`);
    },
  },
  {
    name: 'artifact_copy',
    description: 'Copy export preview metadata for vault or backup surfaces.',
    parameters: {
      type: 'object',
      properties: {
        target: { type: 'string', enum: ['vault-json', 'backup-json'] },
        identityId: { type: 'string' },
      },
      required: ['target'],
    },
    handler: (args) => {
      const target = String(args.target ?? '');
      if (target === 'vault-json') {
        return { preview: exportVaultJson(), surface: 'vault-json' };
      }
      if (target === 'backup-json') {
        const identityId = String(args.identityId ?? store.activeIdentityId);
        const preview = exportBackupJson(identityId);
        if (!preview) throw new Error(`Unknown identity id: ${identityId}`);
        return { preview, surface: 'backup-json' };
      }
      throw new Error(`Unknown copy target: ${target}`);
    },
  },
];

const toolMap = new Map(tools.map((t) => [t.name, t]));

function webmcp_session_info() {
  return {
    contract_version: 'zto-webmcp-v1',
    app: 'nostrpass-vault',
    tool_count: tools.length,
  };
}

function webmcp_list_tools() {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));
}

function webmcp_invoke_tool(name: string, args: Record<string, unknown> = {}) {
  const tool = toolMap.get(name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool.handler(args ?? {});
}

declare global {
  interface Window {
    webmcp_session_info: typeof webmcp_session_info;
    webmcp_list_tools: typeof webmcp_list_tools;
    webmcp_invoke_tool: typeof webmcp_invoke_tool;
  }
}

window.webmcp_session_info = webmcp_session_info;
window.webmcp_list_tools = webmcp_list_tools;
window.webmcp_invoke_tool = webmcp_invoke_tool;

if ((navigator as Navigator & { modelContext?: { registerTool: (tool: unknown) => void } }).modelContext?.registerTool) {
  const mc = (navigator as Navigator & { modelContext: { registerTool: (tool: unknown) => void } }).modelContext;
  for (const tool of tools) {
    try {
      mc.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.parameters,
        execute: (args: Record<string, unknown>) => tool.handler(args),
      });
    } catch {
      /* optional */
    }
  }
}

export { webmcp_session_info, webmcp_list_tools, webmcp_invoke_tool };
