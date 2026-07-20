import { z } from "zod";

export const ProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { message: "displayName must not be empty" })
    .max(40, { message: "displayName must be at most 40 characters" }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: "color must be a 6-digit hex string (#RRGGBB)" }),
});

export const JoinRoomSchema = z.object({
  roomId: z
    .string()
    .refine((val) => (val.length === 10 || val.length === 20) && /^[A-Z]+$/.test(val), {
      message: "roomId must be exactly 10 or 20 characters of uppercase A-Z only",
    }),
});

export const DocumentPackageSchema = z.object({
  schemaVersion: z.literal("mduy-document-v1", {
    errorMap: () => ({ message: "schemaVersion must be exactly mduy-document-v1" }),
  }),
  roomId: z
    .string()
    .refine((val) => (val.length === 10 || val.length === 20) && /^[A-Z]+$/.test(val), {
      message: "roomId must be exactly 10 or 20 characters of uppercase A-Z only",
    }),
  markdown: z.string(),
  theme: z.enum(["light", "dark"], {
    errorMap: () => ({ message: "theme must be light or dark" }),
  }),
  profile: ProfileSchema,
});

export type DocumentPackage = z.infer<typeof DocumentPackageSchema>;
