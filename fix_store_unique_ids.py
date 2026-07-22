import re

with open("tasks/frontend-data-tracking-bike-maintenance-mileage-map-recovery-board-rn-canva-live-preview/solution/app/src/store.ts", "r") as f:
    content = f.read()

new_schema = """export const SessionSchema = z.object({
  schemaVersion: z.literal('v1'),
  exportedAt: z.string(),
  records: z.array(BikeRecordSchema).refine((records) => {
    const ids = new Set(records.map(r => r.id));
    return ids.size === records.length;
  }, "Duplicate IDs found in records"),
  derived: z.object({
    totalDistance: z.number(),
    readyCount: z.number(),
    failedCount: z.number(),
    recoveryCount: z.number(),
  }),
  history: z.array(z.object({
    action: z.string(),
    timestamp: z.string(),
    recordId: z.string().optional()
  })),
  recoveryBoardState: z.object({
    selectedRecordId: z.string().nullable(),
  }).optional()
});"""

content = re.sub(r"export const SessionSchema = z\.object\(\{\n(?:.*?\n)+?\}\);", new_schema, content)

with open("tasks/frontend-data-tracking-bike-maintenance-mileage-map-recovery-board-rn-canva-live-preview/solution/app/src/store.ts", "w") as f:
    f.write(content)
