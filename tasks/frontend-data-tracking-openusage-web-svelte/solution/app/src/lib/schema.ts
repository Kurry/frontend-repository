import { z } from 'zod';

export const ProviderResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['consumption', 'balance']),
  limit: z.number().optional(),
  used: z.number().optional(),
  remaining: z.number().optional(),
  unit: z.string(),
  resetAt: z.string().optional(),
  historicalPoints: z.array(z.object({
    date: z.string(),
    value: z.number()
  })).optional()
});

export const ProviderSnapshotSchema = z.object({
  providerId: z.string(),
  name: z.string(),
  status: z.enum(['fresh', 'updating', 'stale', 'error', 'disabled']),
  lastUpdated: z.string().optional(),
  errorMessage: z.string().optional(),
  resources: z.array(ProviderResourceSchema)
});

export const WorkspaceStateSchema = z.object({
  mode: z.enum(['demo', 'loopback', 'api-key']),
  loopbackUrl: z.string().nullable(),
  providers: z.array(ProviderSnapshotSchema),
  pins: z.array(z.object({
    providerId: z.string(),
    resourceId: z.string()
  })).max(2),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }).nullable()
});

export const ExportedWorkspaceSchema = z.object({
  schemaVersion: z.literal('openusage-web-workspace/v1'),
  exportedAt: z.string(),
  sourceMode: z.enum(['demo', 'loopback', 'api-key']),
  loopbackUrl: z.string().nullable(),
  providers: z.array(ProviderSnapshotSchema),
  pins: z.array(z.object({
    providerId: z.string(),
    resourceId: z.string()
  })).max(2),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }).nullable(),
  refreshEvents: z.array(z.any()), // Redacted events
  checksum: z.string()
});
