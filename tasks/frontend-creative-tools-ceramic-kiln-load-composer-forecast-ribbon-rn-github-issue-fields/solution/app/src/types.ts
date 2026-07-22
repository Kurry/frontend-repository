import { z } from "zod";

export const PieceStatusSchema = z.enum([
  "draft",
  "ready",
  "changed",
  "conflict",
  "archived",
]);

export const ClayBodySchema = z.enum([
  "porcelain",
  "stoneware",
  "earthenware",
  "terracotta",
]);

export const PieceSchema = z.object({
  id: z.string().min(1, "ID is required"),
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  maker: z.string().min(1, "Maker is required").max(100, "Maker is too long"),
  dimensions: z.string().min(1, "Dimensions are required"),
  clayBody: ClayBodySchema,
  glaze: z.string().min(1, "Glaze is required"),
  cone: z.number().min(-22).max(14), // Common cone ranges
  status: PieceStatusSchema,
});

export const QuerySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  filter: z.object({
    status: z.array(PieceStatusSchema).optional(),
    clayBody: z.array(ClayBodySchema).optional(),
  }),
});

export const HistoryEntrySchema = z.object({
  timestamp: z.string(),
  action: z.string(),
  details: z.string(),
  user: z.string().optional(),
});

export const ArtifactSchema = z.object({
  schemaVersion: z.literal("kiln-load-v1"),
  exportedAt: z.string(),
  pieces: z.array(PieceSchema),
  queries: z.array(QuerySchema),
  history: z.array(HistoryEntrySchema),
});

export type PieceStatus = z.infer<typeof PieceStatusSchema>;
export type ClayBody = z.infer<typeof ClayBodySchema>;
export type Piece = z.infer<typeof PieceSchema>;
export type Query = z.infer<typeof QuerySchema>;
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;
