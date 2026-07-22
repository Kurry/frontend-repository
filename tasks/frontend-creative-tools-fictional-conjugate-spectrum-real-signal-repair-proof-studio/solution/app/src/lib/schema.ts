// Schema definitions
import { z } from 'zod';

export const NoteSchema = z.object({
  id: z.string(),
  targetId: z.string(), // e.g. "BIN-K1"
  actor: z.string(),
  text: z.string(),
  tick: z.number()
});
export type Note = z.infer<typeof NoteSchema>;

export const ReviewSchema = z.object({
  id: z.string(),
  targetId: z.string(),
  actor: z.string(),
  verdict: z.enum(["inspect", "conjugate-repair-exact", "accepted-fictional"]),
  noteId: z.string().optional(),
  tick: z.number(),
  stateHash: z.string()
});
export type Review = z.infer<typeof ReviewSchema>;

export const ApprovalSchema = z.object({
  id: z.string(),
  tick: z.number(),
  stateHash: z.string()
});
export type Approval = z.infer<typeof ApprovalSchema>;

export type BinId = "BIN-K0" | "BIN-K1" | "BIN-K2" | "BIN-K3";

export type EventLog = {
  id: string;
  tick: number;
  actor: string;
  operation: string;
  binId?: string;
  fieldId?: string;
  beforeValue?: {r: number, i: number}; // Quarters
  afterValue?: {r: number, i: number};  // Quarters
  parent?: string;
  branch?: string;
  stateHash: string;
};
