import { z } from 'zod';

export const GRANT_KEYS = ['damus', 'snort', 'coracle', 'iris'] as const;

export const labelSchema = z
  .string()
  .superRefine((val, ctx) => {
    const trimmed = val.trim();
    if (val.length > 0 && trimmed.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Label cannot be whitespace only. Enter a non-empty label.',
      });
      return;
    }
    if (trimmed.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Label cannot be empty. Enter a label between 1 and 40 characters.',
      });
      return;
    }
    if (trimmed.length > 40) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Label cannot exceed 40 characters. Shorten the label to 40 characters or fewer.',
      });
    }
  })
  .transform((val) => val.trim());

export const identityFormSchema = z.object({
  label: labelSchema,
});

const grantSchema = z.object({
  damus: z.boolean(),
  snort: z.boolean(),
  coracle: z.boolean(),
  iris: z.boolean(),
});

const identityRecordSchema = z.object({
  label: labelSchema,
  npub: z.string().startsWith('npub1', { message: 'npub must start with npub1.' }),
  nsec: z.string().startsWith('nsec1', { message: 'nsec must start with nsec1.' }),
  grants: grantSchema,
});

export const vaultImportSchema = z.object({
  version: z.literal('nostrpass-vault-v1', {
    errorMap: () => ({ message: 'Vault version must be nostrpass-vault-v1.' }),
  }),
  activeLabel: z.string(),
  theme: z.enum(['light', 'dark'], { message: 'Theme must be light or dark.' }),
  identities: z.array(identityRecordSchema).min(1, 'Vault must include at least one identity.'),
});

export const backupSchema = z.object({
  version: z.literal('nostrpass-backup-v1', {
    errorMap: () => ({ message: 'Backup version must be nostrpass-backup-v1.' }),
  }),
  exportedAt: z.string().datetime({ message: 'exportedAt must be an ISO-8601 date-time.' }),
  identity: identityRecordSchema,
});

export function validateLabelInput(raw: string): string | null {
  const result = labelSchema.safeParse(raw);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? 'Label is invalid.';
}
