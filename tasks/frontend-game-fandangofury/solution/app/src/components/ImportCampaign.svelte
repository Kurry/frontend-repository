<script lang="ts">
  import { game } from '../lib/game-store.svelte.ts';
  import OverlayShell from './OverlayShell.svelte';
  import { campaignSchema } from '../lib/campaign-schema';

  interface Props {
    onClose: () => void;
  }
  let { onClose }: Props = $props();

  let jsonInput = $state('');
  let validationError = $state('');
  let importSuccess = $state(false);

  function handleImport() {
    validationError = '';
    importSuccess = false;
    let parsed;
    try {
      parsed = JSON.parse(jsonInput);
    } catch {
      validationError = 'document: invalid JSON format';
      return;
    }

    const result = campaignSchema.safeParse(parsed);
    if (!result.success) {
      const firstError = result.error.errors[0];
      const field = firstError.path.length ? firstError.path.join('.') : 'document';
      validationError = `${field}: ${firstError.message}`;
      return;
    }

    game.importCampaign(result.data);
    importSuccess = true;
    game.showToast('Campaign imported successfully', 'success');
    setTimeout(() => {
      onClose();
    }, 1200);
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

<OverlayShell
  title="Import Campaign"
  emoji="📥"
  accent="#3b82f6"
  maxWidth="max-w-2xl"
  subtitle="Paste or load a Campaign JSON document"
  {onClose}
>
  <div class="flex flex-col gap-4 h-full">
    <label
      for="import-file"
      class="btn-interactive min-h-12 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white text-center cursor-pointer border border-gray-500/30"
    >
      📁 Select File
    </label>
    <input type="file" id="import-file" accept=".json,application/json" class="hidden" onchange={handleFileChange} />

    <label for="campaign-json-input" class="text-sm font-bold text-slate-200">Campaign JSON</label>
    <textarea
      id="campaign-json-input"
      class="w-full min-h-[160px] bg-gray-900 border border-gray-700 rounded-xl p-4 text-xs text-emerald-300 font-mono resize-none focus:outline-none focus:border-blue-500"
      bind:value={jsonInput}
      placeholder="Paste Campaign JSON here (schemaVersion fandangofury.campaign.v1)"
    ></textarea>

    {#if validationError}
      <div class="text-red-400 text-sm font-bold bg-red-900/20 p-3 rounded-lg border border-red-500/30" role="alert" aria-live="assertive">
        ❌ {validationError}
      </div>
    {/if}

    {#if importSuccess}
      <div class="text-emerald-400 text-sm font-bold bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/30" role="status" aria-live="polite">
        ✅ Import successful!
      </div>
    {/if}

    <button
      class="btn-interactive w-full min-h-12 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white border border-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
      onclick={handleImport}
      disabled={!jsonInput.trim() || importSuccess}
    >
      📥 Import Data
    </button>
  </div>
</OverlayShell>
