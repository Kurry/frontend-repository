import { z } from 'zod';

export const InvoiceStatusEnum = z.enum(["draft", "ready", "sent", "paid", "archived", "conflict"]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

export const InvoiceSchema = z.object({
  id: z.string(),
  clientName: z.string().min(1, "Client name is required"),
  amount: z.number().min(0, "Amount must be positive"),
  status: InvoiceStatusEnum,
  dueDate: z.string().min(1, "Due date is required"),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export const ArtifactSchema = z.object({
  schemaVersion: z.literal("v1"),
  exportedAt: z.string(),
  records: z.array(InvoiceSchema)
});

export type Artifact = z.infer<typeof ArtifactSchema>;
