import { z } from 'zod';

export const MASK_IDS = ['sol-rojo', 'noche-azul', 'oro-vivo'] as const;
export const STAGE_IDS = [1, 2, 3] as const;

const maskId = z.enum(MASK_IDS);
const stageId = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const unique = <T>(items: T[]) => new Set(items).size === items.length;

export const campaignSchema = z
  .object({
    schemaVersion: z.literal('fandangofury.campaign.v1'),
    fighter: z
      .object({
        displayName: z.string().trim().min(2).max(20),
        effectsIntensity: z.number().int().min(0).max(100),
      })
      .strict(),
    pesos: z.number().int().min(0),
    upgrades: z
      .object({
        maxHealth: z.number().int().min(0),
        attackPower: z.number().int().min(0),
        furyGain: z.number().int().min(0),
      })
      .strict(),
    masks: z
      .object({
        owned: z.array(maskId).refine(unique, { message: 'must not contain duplicate Mask ids' }),
        equipped: maskId.nullable(),
      })
      .strict()
      .superRefine((value, context) => {
        if (value.equipped && !value.owned.includes(value.equipped)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'must also appear in masks.owned',
            path: ['equipped'],
          });
        }
      }),
    stages: z
      .object({
        unlocked: z
          .array(stageId)
          .min(1)
          .refine(unique, { message: 'must not contain duplicate Stage ids' })
          .refine((value) => value.includes(1), { message: 'must include stage 1' }),
        completed: z.array(stageId).refine(unique, { message: 'must not contain duplicate Stage ids' }),
      })
      .strict()
      .superRefine((value, context) => {
        if (value.completed.some((stage) => !value.unlocked.includes(stage))) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'must be a subset of stages.unlocked',
            path: ['completed'],
          });
        }
      }),
    checkpoint: z
      .object({
        stageId,
        waveIndex: z.number().int().min(1),
        phase: z.enum(['wave', 'boss']),
        fighterHealth: z.number().int().min(1),
        furyMeter: z.number().int().min(0).max(100),
        pesosEarnedThisRun: z.number().int().min(0),
        comboCount: z.number().int().min(0),
      })
      .strict()
      .nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.checkpoint && !value.stages.unlocked.includes(value.checkpoint.stageId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'stageId must be in stages.unlocked',
        path: ['checkpoint', 'stageId'],
      });
    }
  });

export type Campaign = z.infer<typeof campaignSchema>;
