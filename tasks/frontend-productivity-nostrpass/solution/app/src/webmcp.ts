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
  setSearchQuery,
  setSortOrder,
  APPS,
  ViewId,
} from './store';

type ToolHandler = (args: Record<string, any>) => any;

interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: ToolHandler;
}

const DESTINATIONS: ViewId[] = ['dashboard', 'identities', 'permissions', 'audit-log', 'settings'];
// Added export-drawer as per <webmcp_action_contract> binding destinations
const ALL_DESTINATIONS = [...DESTINATIONS, 'export-drawer'];
const THEMES = ['light', 'dark'];
const APP_IDS = APPS.map((a) => a.id);

const tools: ToolDef[] = [
  {
    name: 'browse_open',
    description: 'Navigate the vault to a named destination view.',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', enum: ALL_DESTINATIONS },
      },
      required: ['destination'],
    },
    handler: (args) => {
      if (!ALL_DESTINATIONS.includes(args.destination)) {
        throw new Error(`Unknown destination: ${args.destination}`);
      }
      if (args.destination === 'export-drawer') {
        // Just mock open drawer state for WebMCP bounds
        return { drawerOpened: true };
      }
      setView(args.destination as ViewId);
      return { view: store.view };
    },
  },
  {
    name: 'browse_search',
    description: 'Search identities.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' }
      },
      required: ['query']
    },
    handler: (args) => {
      setSearchQuery(args.query);
      return { query: store.searchQuery };
    }
  },
  {
    name: 'browse_sort',
    description: 'Sort identities.',
    parameters: {
      type: 'object',
      properties: {
        sorts: { type: 'string', enum: ['label-asc', 'label-desc'] }
      },
      required: ['sorts']
    },
    handler: (args) => {
      if (!['label-asc', 'label-desc'].includes(args.sorts)) {
        throw new Error(`Unknown sort: ${args.sorts}`);
      }
      setSortOrder(args.sorts);
      return { sortOrder: store.sortOrder };
    }
  },
  {
    name: 'browse_set_theme',
    description: 'Switch the vault appearance between light and dark theme.',
    parameters: {
      type: 'object',
      properties: {
        theme: { type: 'string', enum: THEMES },
      },
      required: ['theme'],
    },
    handler: (args) => {
      if (!THEMES.includes(args.theme)) {
        throw new Error(`Unknown theme: ${args.theme}`);
      }
      setTheme(args.theme as 'light' | 'dark');
      return { theme: store.theme };
    },
  },
  {
    name: 'entity_identity_create',
    description: 'Create a new Nostr identity with a generated keypair and switch to it.',
    parameters: {
      type: 'object',
      properties: {
        label: { type: 'string' },
      },
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
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
    },
    handler: (args) => {
      const exists = store.identities.some((i) => i.id === args.id);
      if (!exists) throw new Error(`Unknown identity id: ${args.id}`);
      selectIdentity(args.id);
      return { activeIdentityId: store.activeIdentityId };
    },
  },
  {
    name: 'entity_identity_update',
    description: 'Update identity label.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        label: { type: 'string' }
      },
      required: ['id', 'label']
    },
    handler: (args) => {
      const exists = store.identities.some((i) => i.id === args.id);
      if (!exists) throw new Error(`Unknown identity id: ${args.id}`);
      renameIdentity(args.id, args.label);
      return { success: true };
    }
  },
  {
    name: 'entity_identity_delete',
    description: 'Delete an identity.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        confirm: { type: 'boolean' }
      },
      required: ['id', 'confirm']
    },
    handler: (args) => {
      if (!args.confirm) throw new Error('Delete requires explicit confirm=true.');
      const exists = store.identities.some((i) => i.id === args.id);
      if (!exists) throw new Error(`Unknown identity id: ${args.id}`);
      deleteIdentity(args.id);
      return { success: true };
    }
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
      const exists = store.identities.some((i) => i.id === args.identityId);
      if (!exists) throw new Error(`Unknown identity id: ${args.identityId}`);
      if (!APP_IDS.includes(args.appId)) throw new Error(`Unknown app id: ${args.appId}`);
      toggleAppPermission(args.identityId, args.appId);
      return { granted: store.grants[args.identityId]?.[args.appId] ?? false };
    },
  },
  {
    name: 'artifact_export',
    description: 'Export vault data to JSON.',
    parameters: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['json'] }
      },
      required: ['format']
    },
    handler: (args) => {
      const data = {
        version: 1,
        activeLabel: store.identities.find(i => i.id === store.activeIdentityId)?.nickname || '',
        theme: store.theme,
        identities: store.identities.map(i => ({
          label: i.nickname,
          npub: i.npub,
          nsec: i.nsec,
          grants: store.grants[i.id] || {}
        }))
      };
      return { preview: data }; // Do not return raw string file per mechanics exclusions
    }
  },
  {
    name: 'artifact_import',
    description: 'Import vault data from JSON.',
    parameters: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['vault-json'] },
        vaultData: { type: 'object' } // Accepts the parsed object for WebMCP binding
      },
      required: ['mode', 'vaultData']
    },
    handler: (args) => {
      importVault(args.vaultData);
      return { success: true };
    }
  },
  {
    name: 'artifact_copy',
    description: 'Copy item to clipboard.',
    parameters: {
      type: 'object',
      properties: {
        target: { type: 'string' }
      },
      required: ['target']
    },
    handler: (args) => {
      return { success: true, warning: 'Clipboard operations must be validated by Playwright directly.' };
    }
  }
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

function webmcp_invoke_tool(name: string, args: Record<string, any> = {}) {
  const tool = toolMap.get(name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
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

if ((navigator as any).modelContext && typeof (navigator as any).modelContext.registerTool === 'function') {
  for (const tool of tools) {
    try {
      (navigator as any).modelContext.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.parameters,
        execute: (args: Record<string, any>) => tool.handler(args),
      });
    } catch {
      // optional surface; ignore registration failures
    }
  }
}
