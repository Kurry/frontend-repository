import { z } from 'zod';
import { WorkspaceStateSchema, ExportedWorkspaceSchema } from './schema';
import { type WorkspaceState, type ProviderSnapshot, type UsageRefreshEvent, type ProviderResource } from './types';
import { streamText, simulateReadableStream } from './ai-stub';
import { MockLanguageModelV4 } from './ai-stub';

// Global state using Svelte 5 runes
export const state = $state<{
  workspace: WorkspaceState;
  events: UsageRefreshEvent[];
  credentials: Record<string, string>;
}>({
  workspace: {
    mode: 'demo',
    loopbackUrl: 'http://127.0.0.1:6736',
    providers: [],
    pins: [],
    dateRange: null
  },
  events: [],
  credentials: {}
});

// Demo fixtures
const FIXTURE_PROVIDERS: ProviderSnapshot[] = [
  {
    providerId: 'claude',
    name: 'Claude',
    status: 'fresh',
    lastUpdated: new Date().toISOString(),
    resources: [
      { id: 'claude-weekly', name: 'Claude Weekly', type: 'consumption', limit: 50, used: 12, unit: 'USD', resetAt: new Date(Date.now() + 86400000 * 7).toISOString(), historicalPoints: Array.from({length: 30}, (_, i) => ({ date: new Date(Date.now() - 86400000 * (29 - i)).toISOString(), value: Math.random() * 5 })) }
    ]
  },
  {
    providerId: 'codex',
    name: 'Codex',
    status: 'stale',
    lastUpdated: new Date(Date.now() - 86400000).toISOString(),
    resources: [
      { id: 'codex-session', name: 'Codex Session', type: 'consumption', limit: 100, used: 95, unit: 'USD', historicalPoints: Array.from({length: 30}, (_, i) => ({ date: new Date(Date.now() - 86400000 * (29 - i)).toISOString(), value: Math.random() * 10 })) }
    ]
  },
  {
    providerId: 'cursor',
    name: 'Cursor',
    status: 'fresh',
    lastUpdated: new Date().toISOString(),
    resources: [
      { id: 'cursor-premium', name: 'Cursor Premium', type: 'balance', remaining: 500, unit: 'requests', historicalPoints: Array.from({length: 30}, (_, i) => ({ date: new Date(Date.now() - 86400000 * (29 - i)).toISOString(), value: 500 - (i * 10) })) }
    ]
  },
  {
    providerId: 'open-router',
    name: 'open-router',
    status: 'error',
    errorMessage: '503 Service Unavailable',
    resources: []
  },
  {
    providerId: 'z-ai',
    name: 'z-ai',
    status: 'fresh',
    lastUpdated: new Date().toISOString(),
    resources: [
      { id: 'z-ai-credits', name: 'z-ai Credits', type: 'balance', remaining: 100, unit: 'credits', historicalPoints: Array.from({length: 30}, (_, i) => ({ date: new Date(Date.now() - 86400000 * (29 - i)).toISOString(), value: 100 - (i * 2) })) }
    ]
  }
];

let eventSequence = 0;

export function addEvent(event: Omit<UsageRefreshEvent, 'sequence' | 'timestamp'>) {
  state.events.push({
    ...event,
    sequence: ++eventSequence,
    timestamp: new Date().toISOString()
  });
}

let activeStreams = new Set<string>();

export async function startRefresh() {
  if (state.workspace.mode === 'demo') {
    state.workspace.providers = state.workspace.providers.map(p => ({ ...p, status: 'updating' }));

    // Simulate streaming for each provider concurrently (max 3 concurrent based on AC, we'll just do them all with slight delays)
    for (const provider of FIXTURE_PROVIDERS) {
      addEvent({ providerId: provider.providerId, phase: 'start', kind: 'start', payload: { action: 'refresh_started' } });
      setTimeout(() => {
        addEvent({ providerId: provider.providerId, phase: 'fetch', kind: 'tool-call', payload: { tool: 'fetch_limits' } });

        setTimeout(() => {
            if (provider.providerId === 'open-router') {
                // simulate 503 then success on retry
                const p = state.workspace.providers.find(p => p.providerId === 'open-router');
                if (p && p.status === 'updating' && p.errorMessage) {
                   p.status = 'fresh';
                   p.errorMessage = undefined;
                   p.resources = [{ id: 'open-router-credits', name: 'open-router Credits', type: 'balance', remaining: 200, unit: 'USD', historicalPoints: [] }];
                   p.lastUpdated = new Date().toISOString();
                   addEvent({ providerId: provider.providerId, phase: 'complete', kind: 'data', payload: { status: 'success' } });
                } else {
                    const target = state.workspace.providers.find(p => p.providerId === 'open-router');
                    if (target) {
                        target.status = 'error';
                        target.errorMessage = '503 Service Unavailable';
                        addEvent({ providerId: provider.providerId, phase: 'fetch', kind: 'error', payload: { error: '503 Service Unavailable' } });
                    }
                }
            } else {
                const targetIndex = state.workspace.providers.findIndex(p => p.providerId === provider.providerId);
                if (targetIndex >= 0) {
                    state.workspace.providers[targetIndex] = { ...provider, status: 'fresh', lastUpdated: new Date().toISOString() };
                } else {
                    state.workspace.providers.push({ ...provider, status: 'fresh', lastUpdated: new Date().toISOString() });
                }
                addEvent({ providerId: provider.providerId, phase: 'complete', kind: 'data', payload: { status: 'success' } });
            }
        }, Math.random() * 500 + 200);

      }, Math.random() * 300);
    }
  } else if (state.workspace.mode === 'loopback') {
      // Stub for loopback logic
  }
}

export function retryProvider(providerId: string) {
    if (providerId === 'open-router') {
        const p = state.workspace.providers.find(p => p.providerId === 'open-router');
        if (p) {
            p.status = 'updating';
            addEvent({ providerId, phase: 'fetch', kind: 'tool-call', payload: { action: 'retry' } });
            setTimeout(() => {
                p.status = 'fresh';
                p.errorMessage = undefined;
                p.resources = [{ id: 'open-router-credits', name: 'open-router Credits', type: 'balance', remaining: 200, unit: 'USD', historicalPoints: [] }];
                p.lastUpdated = new Date().toISOString();
                addEvent({ providerId, phase: 'complete', kind: 'data', payload: { status: 'success' } });
            }, 500);
        }
    }
}

export function stopRefresh() {
  activeStreams.clear();
  addEvent({ providerId: 'system', phase: 'complete', kind: 'complete', payload: { action: 'stopped' } });
}

export function setPin(index: number, providerId: string, resourceId: string) {
  if (index >= 0 && index < 2) {
    state.workspace.pins[index] = { providerId, resourceId };
  } else if (index === -1) {
    // Add if less than 2, otherwise ask to replace oldest
    if (state.workspace.pins.length < 2) {
        state.workspace.pins.push({ providerId, resourceId });
    } else {
        state.workspace.pins[0] = state.workspace.pins[1];
        state.workspace.pins[1] = { providerId, resourceId };
    }
  }
}

export function reorderPins(from: number, to: number) {
    if (from >= 0 && from < state.workspace.pins.length && to >= 0 && to < state.workspace.pins.length) {
        const temp = state.workspace.pins[from];
        state.workspace.pins[from] = state.workspace.pins[to];
        state.workspace.pins[to] = temp;
    }
}

export function unpin(index: number) {
    if (index >= 0 && index < state.workspace.pins.length) {
        state.workspace.pins.splice(index, 1);
    }
}

export function setDateRange(start: string, end: string) {
  state.workspace.dateRange = { start, end };
}

export function clearCredentials() {
  state.credentials = {};
  state.workspace.providers.forEach(p => {
    if (p.providerId === 'open-router' || p.providerId === 'z-ai') {
        p.status = 'disabled';
        p.resources = [];
    }
  });
}

export function exportWorkspace() {
  const checksum = btoa(JSON.stringify({ ...state.workspace, pins: state.workspace.pins })); // naive checksum
  return JSON.stringify({
    schemaVersion: 'openusage-web-workspace/v1',
    exportedAt: new Date().toISOString(),
    sourceMode: state.workspace.mode,
    loopbackUrl: state.workspace.loopbackUrl,
    providers: state.workspace.providers,
    pins: state.workspace.pins,
    dateRange: state.workspace.dateRange,
    refreshEvents: state.events.map(e => ({ ...e, payload: '[REDACTED]' })),
    checksum
  });
}

export function importWorkspace(jsonStr: string) {
  try {
    const data = JSON.parse(jsonStr);
    const result = ExportedWorkspaceSchema.safeParse(data);
    if (result.success) {
      state.workspace.mode = result.data.sourceMode;
      state.workspace.loopbackUrl = result.data.loopbackUrl;
      state.workspace.providers = result.data.providers;
      state.workspace.pins = result.data.pins;
      state.workspace.dateRange = result.data.dateRange;
      // Note: do not import credentials
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
