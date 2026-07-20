import { z } from "zod";

export const PeerIdentitySchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name must be at least 1 character")
    .max(40, "Display name must be at most 40 characters"),
});

export const JoinSessionSchema = z.object({
  roomId: z
    .string()
    .trim()
    .min(1, "Room ID must be at least 1 character")
    .max(64, "Room ID must be at most 64 characters")
    .regex(/^[A-Za-z0-9\-_]+$/, "Room ID can only contain letters, numbers, hyphens, and underscores"),
});

export const ChatMessageSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be at most 2000 characters"),
});

export const FileQueueStatusSchema = z.enum([
  "not-started",
  "transferring",
  "paused",
  "completed",
  "canceled",
]);

export const FileQueueEntrySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  status: FileQueueStatusSchema,
  bytesTransferred: z.number().int().nonnegative(),
});

export const TransferLogEventSchema = z.enum([
  "queued",
  "started",
  "paused",
  "resumed",
  "canceled",
  "completed",
  "retried",
  "removed",
]);

export const TransferLogEntrySchema = z.object({
  id: z.string(),
  at: z.string().datetime({ offset: true }), // ISO-8601
  fileName: z.string().min(1),
  event: TransferLogEventSchema,
});

export const SessionPackSchema = z.object({
  schemaVersion: z.literal("weblink-session-v2"),
  exportedAt: z.string().datetime({ offset: true }), // ISO-8601
  peer: PeerIdentitySchema.extend({
    clientId: z.string(),
  }),
  roomId: JoinSessionSchema.shape.roomId.or(z.literal("")),
  theme: z.enum(["light", "dark"]),
  messages: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      role: z.enum(["local", "demo"]),
      createdAt: z.string().datetime({ offset: true }), // ISO-8601
    })
  ),
  fileQueue: z.array(FileQueueEntrySchema),
  transferLog: z.array(TransferLogEntrySchema),
});
