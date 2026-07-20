<script lang="ts">
  import { game, gameState } from '../lib/game-store.svelte.ts';
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { z } from 'zod';

  interface Props {
    onClose: () => void;
  }
  let { onClose }: Props = $props();

  const settingsSchema = z.object({
    displayName: z.string().min(2, "displayName must be at least 2 characters").max(20, "displayName must be at most 20 characters"),
    effectsIntensity: z.number({ coerce: true }).int().min(0, "effectsIntensity must be at least 0").max(100, "effectsIntensity must be at most 100"),
  });

  const { form, data, errors, isValid } = createForm({
    initialValues: {
      displayName: gameState.fighterDisplayName,
      effectsIntensity: gameState.fighterEffectsIntensity,
    },
    extend: validator({ schema: settingsSchema }),
    onSubmit: (values) => {
      game.updateFighterSettings(values.displayName, values.effectsIntensity);
      onClose();
    },
  });
</script>

<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
  <div
    class="bg-fury-dark border border-teal-500/30 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col"
    role="dialog"
    aria-label="Fighter Settings"
  >
    <div class="bg-fury-dark border-b border-teal-500/20 rounded-t-2xl p-4 sm:p-6 flex-shrink-0">
      <div class="flex items-center justify-between">
        <h2 class="text-xl sm:text-2xl font-black text-teal-400">⚙️ Fighter Settings</h2>
        <button
          class="btn-interactive min-h-12 min-w-12 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-lg text-slate-100"
          onclick={onClose}
          aria-label="Close settings"
        >
          ✕
        </button>
      </div>
    </div>

    <div class="p-4 sm:p-6 flex-1 min-h-0">
      <form use:form class="flex flex-col gap-4">
        <div>
          <label for="displayName" class="block text-sm font-bold text-slate-200 mb-1">Fighter Display Name</label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            class="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:border-teal-500 min-h-12"
          />
          {#if $errors.displayName}
            <span class="text-xs text-red-400 mt-1 block">{$errors.displayName[0]}</span>
          {/if}
        </div>

        <div>
          <label for="effectsIntensity" class="block text-sm font-bold text-slate-200 mb-1">Effects Intensity (0-100)</label>
          <input
            id="effectsIntensity"
            name="effectsIntensity"
            type="number"
            class="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:border-teal-500 min-h-12"
          />
          {#if $errors.effectsIntensity}
            <span class="text-xs text-red-400 mt-1 block">{$errors.effectsIntensity[0]}</span>
          {/if}
        </div>

        <button
          type="submit"
          class="btn-interactive w-full min-h-12 mt-4 px-4 py-2 rounded-lg font-bold text-white border { $isValid ? 'bg-teal-600 hover:bg-teal-500 border-teal-400/30' : 'bg-gray-700 border-gray-600 opacity-50 cursor-not-allowed' }"
          disabled={!$isValid}
        >
          Save Settings
        </button>
      </form>
    </div>
  </div>
</div>
