<script lang="ts">
  import { game, gameState } from '../lib/game-store.svelte.ts';
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { z } from 'zod';

  interface Props {
    onClose: () => void;
  }
  let { onClose }: Props = $props();

  const campaignSchema = z.object({
    schemaVersion: z.literal('fandangofury.campaign.v1'),
    fighter: z.object({
      displayName: z.string().min(2).max(20),
      effectsIntensity: z.number().int().min(0).max(100),
    }),
    pesos: z.number().int().min(0),
    upgrades: z.object({
      maxHealth: z.number().int().min(0),
      attackPower: z.number().int().min(0),
      furyGain: z.number().int().min(0),
    }),
    masks: z.object({
      owned: z.array(z.enum(['sol-rojo', 'noche-azul', 'oro-vivo'])),
      equipped: z.enum(['sol-rojo', 'noche-azul', 'oro-vivo']).nullable(),
    }).superRefine((val, ctx) => {
      if (val.equipped && !val.owned.includes(val.equipped)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'equipped must be in owned',
          path: ['equipped']
        });
      }
    }),
    stages: z.object({
      unlocked: z.array(z.literal(1).or(z.literal(2)).or(z.literal(3))).min(1).refine(val => val.includes(1), { message: 'Must include stage 1' }),
      completed: z.array(z.literal(1).or(z.literal(2)).or(z.literal(3))),
    }).superRefine((val, ctx) => {
      for (const comp of val.completed) {
        if (!val.unlocked.includes(comp)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'completed must be subset of unlocked',
            path: ['completed']
          });
        }
      }
    }),
    checkpoint: z.object({
      stageId: z.literal(1).or(z.literal(2)).or(z.literal(3)),
      waveIndex: z.number().int().min(1),
      phase: z.enum(['wave', 'boss']),
      fighterHealth: z.number().int().min(1),
      furyMeter: z.number().int().min(0).max(100),
      pesosEarnedThisRun: z.number().int().min(0),
      comboCount: z.number().int().min(0),
    }).nullable(),
  }).superRefine((val, ctx) => {
    if (val.checkpoint && !val.stages.unlocked.includes(val.checkpoint.stageId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'checkpoint stageId must be in unlocked stages',
        path: ['checkpoint', 'stageId']
      });
    }
  });

  let jsonInput = $state('');
  let validationError = $state('');
  let importSuccess = $state(false);

  function handleImport() {
    validationError = '';
    importSuccess = false;
    let parsed;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (e) {
      validationError = 'Invalid JSON format';
      return;
    }

    const result = campaignSchema.safeParse(parsed);
    if (!result.success) {
      const firstError = result.error.errors[0];
      validationError = `${firstError.path.join('.')}: ${firstError.message}`;
      return;
    }

    game.importCampaign(result.data);
    importSuccess = true;
    setTimeout(() => {
      onClose();
    }, 1500);
  }

  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        jsonInput = e.target?.result as string;
      };
      reader.readAsText(input.files[0]);
    }
  }
</script>

<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
  <div
    class="bg-fury-dark border border-blue-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
    role="dialog"
    aria-label="Import Campaign"
  >
    <div class="bg-fury-dark border-b border-blue-500/20 rounded-t-2xl p-4 sm:p-6 flex-shrink-0">
      <div class="flex items-center justify-between">
        <h2 class="text-xl sm:text-2xl font-black text-blue-400">📥 Import Campaign</h2>
        <button
          class="btn-interactive min-h-12 min-w-12 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-lg text-slate-100"
          onclick={onClose}
          aria-label="Close import"
        >
          ✕
        </button>
      </div>
      <p class="text-slate-300 text-xs mt-1">Paste your campaign JSON or select a file to import</p>
    </div>

    <div class="p-4 sm:p-6 flex-1 min-h-0 flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label for="import-file" class="btn-interactive min-h-12 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white text-center cursor-pointer border border-gray-500/30">
          📁 Select File
        </label>
        <input type="file" id="import-file" accept=".json,application/json" class="hidden" onchange={handleFileChange} />
      </div>

      <textarea
        class="flex-1 w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-xs text-emerald-300 font-mono resize-none focus:outline-none focus:border-blue-500"
        bind:value={jsonInput}
        placeholder="Paste JSON here..."
      ></textarea>

      {#if validationError}
        <div class="text-red-400 text-sm font-bold bg-red-900/20 p-3 rounded-lg border border-red-500/30" role="alert">
          ❌ {validationError}
        </div>
      {/if}
      
      {#if importSuccess}
        <div class="text-emerald-400 text-sm font-bold bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/30" role="alert">
          ✅ Import successful!
        </div>
      {/if}

      <div class="flex-shrink-0">
        <button
          class="btn-interactive w-full min-h-12 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white border border-blue-400/30"
          onclick={handleImport}
          disabled={!jsonInput || importSuccess}
        >
          📥 Import Data
        </button>
      </div>
    </div>
  </div>
</div>
