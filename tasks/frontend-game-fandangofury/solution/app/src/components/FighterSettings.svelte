<script lang="ts">
  import { game, gameState } from '../lib/game-store.svelte.ts';
  import OverlayShell from './OverlayShell.svelte';
  import { z } from 'zod';

  interface Props {
    onClose: () => void;
  }
  let { onClose }: Props = $props();

  const nameSchema = z
    .string()
    .trim()
    .min(2, 'displayName must be at least 2 characters')
    .max(20, 'displayName must be at most 20 characters');
  const intensitySchema = z
    .string()
    .trim()
    .min(1, 'effectsIntensity is required')
    .regex(/^\d+$/, 'effectsIntensity must be a whole number')
    .transform(Number)
    .pipe(
      z
        .number()
        .int('effectsIntensity must be a whole number')
        .min(0, 'effectsIntensity must be at least 0')
        .max(100, 'effectsIntensity must be at most 100'),
    );

  let displayName = $state(gameState.fighterDisplayName);
  let intensityText = $state(String(gameState.fighterEffectsIntensity));

  const nameError = $derived.by(() => {
    const r = nameSchema.safeParse(displayName);
    return r.success ? '' : r.error.errors[0].message;
  });
  const intensityError = $derived.by(() => {
    const r = intensitySchema.safeParse(intensityText);
    return r.success ? '' : r.error.errors[0].message;
  });
  const isValid = $derived(!nameError && !intensityError);

  function handleSave() {
    if (!isValid) return;
    game.updateFighterSettings(displayName, intensitySchema.parse(intensityText));
    onClose();
  }
</script>

<OverlayShell
  title="Fighter Settings"
  emoji="⚙️"
  accent="#14b8a6"
  maxWidth="max-w-md"
  subtitle="Customize your fighter and effects"
  {onClose}
>
  <form class="flex flex-col gap-4" onsubmit={(e) => { e.preventDefault(); handleSave(); }} novalidate>
    <div>
      <label for="displayName" class="block text-sm font-bold text-slate-200 mb-1">Fighter Display Name</label>
      <input
        id="displayName"
        name="displayName"
        type="text"
        autocomplete="off"
        aria-invalid={nameError ? 'true' : 'false'}
        aria-describedby="displayName-error"
        bind:value={displayName}
        class="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:border-teal-500 min-h-12"
      />
      {#if nameError}
        <span id="displayName-error" class="text-xs text-red-400 mt-1 block" role="alert">{nameError}</span>
      {/if}
    </div>

    <div>
      <label for="effectsIntensity" class="block text-sm font-bold text-slate-200 mb-1">Effects Intensity (0–100)</label>
      <input
        id="effectsIntensity"
        name="effectsIntensity"
        type="number"
        min="0"
        max="100"
        step="1"
        aria-invalid={intensityError ? 'true' : 'false'}
        aria-describedby="effectsIntensity-error"
        bind:value={intensityText}
        class="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:border-teal-500 min-h-12"
      />
      {#if intensityError}
        <span id="effectsIntensity-error" class="text-xs text-red-400 mt-1 block" role="alert">{intensityError}</span>
      {/if}
    </div>

    <button
      type="submit"
      class="btn-interactive w-full min-h-12 mt-2 px-4 py-2 rounded-lg font-bold text-white border {isValid
        ? 'bg-teal-600 hover:bg-teal-500 border-teal-400/30'
        : 'bg-gray-700 border-gray-600 opacity-50 cursor-not-allowed'}"
      disabled={!isValid}
    >
      Save Settings
    </button>
  </form>
</OverlayShell>
