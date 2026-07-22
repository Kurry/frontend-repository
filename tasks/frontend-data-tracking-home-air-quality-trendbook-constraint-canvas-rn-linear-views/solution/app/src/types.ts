import { z } from 'zod';

export const AirQualityStatus = z.enum(['Draft', 'Ready', 'Changed', 'Archived']);
export type AirQualityStatusType = z.infer<typeof AirQualityStatus>;

export const AirQualityRecordSchema = z.object({
  id: z.string().min(1),
  status: AirQualityStatus,
  reading: z.number().min(0).max(1000), // e.g. AQI
  room: z.string().min(1),
  timestamp: z.string().datetime()
});

export type AirQualityRecord = z.infer<typeof AirQualityRecordSchema>;

export const HomeAirQualityTrendbookSessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string().datetime(),
  records: z.array(AirQualityRecordSchema),
  derived: z.object({
    summary: z.record(z.string(), z.number()) // e.g. status counts or average reading
  }),
  history: z.array(z.object({
    action: z.string(),
    recordId: z.string().optional(),
    timestamp: z.string().datetime()
  }))
});

export type HomeAirQualityTrendbookSession = z.infer<typeof HomeAirQualityTrendbookSessionSchema>;
