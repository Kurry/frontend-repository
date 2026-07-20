<template>
  <Transition name="overlay">
    <div
      v-if="store.exportOpen"
      ref="rootRef"
      class="fixed inset-0 z-[95]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-title"
    >
      <div class="absolute inset-0 bg-ink/45" @click="store.exportOpen = false" aria-hidden="true"></div>

      <div
        id="export-drawer"
        class="absolute inset-y-0 right-0 w-full max-w-lg bg-cream border-l border-rule shadow-2xl flex flex-col"
      >
        <div class="px-5 py-4 border-b border-rule flex items-start justify-between gap-3">
          <div>
            <p class="font-mono text-[10px] tracking-[0.28em] uppercase text-ink-soft">Artifact transfer</p>
            <h2 id="export-title" class="font-plate text-2xl leading-tight">Export &amp; Import</h2>
          </div>
          <button
            type="button"
            data-autofocus
            class="min-w-11 min-h-11 -mr-2 inline-flex items-center justify-center font-mono text-sm hover:text-oxblood transition-colors"
            @click="store.exportOpen = false"
          >
            Close<span aria-hidden="true" class="ml-1 text-lg leading-none">×</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-5 py-5 space-y-7">
          <!-- Format tabs -->
          <section aria-label="Export formats">
            <div role="tablist" aria-label="Export format" class="flex flex-wrap gap-1 border-b border-ink">
              <button
                v-for="format in formats"
                :key="format.id"
                type="button"
                role="tab"
                :id="`tab-${format.id}`"
                :aria-selected="store.exportFormat === format.id"
                :aria-controls="`panel-${format.id}`"
                class="min-h-11 px-3.5 font-mono text-[11px] tracking-[0.14em] uppercase border border-b-0 transition-colors -mb-px"
                :class="store.exportFormat === format.id
                  ? 'border-ink bg-parchment text-ink font-bold'
                  : 'border-transparent text-ink-soft hover:text-ink hover:border-rule'"
                @click="store.exportFormat = format.id"
              >
                {{ format.label }}
              </button>
            </div>

            <div
              v-for="format in formats"
              :key="format.id"
              :id="`panel-${format.id}`"
              role="tabpanel"
              :aria-labelledby="`tab-${format.id}`"
              v-show="store.exportFormat === format.id"
            >
              <pre class="mt-0 border border-t-0 border-rule bg-parchment p-3.5 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72 whitespace-pre">{{ artifactText(format.id) }}</pre>
            </div>

            <div class="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                class="min-h-11 px-4 bg-ink text-cream font-mono text-[11px] tracking-[0.14em] uppercase transition-colors hover:bg-oxblood"
                @click="copyActive"
              >
                Copy {{ activeFormat.label }}
              </button>
              <button
                type="button"
                class="min-h-11 px-4 border border-ink font-mono text-[11px] tracking-[0.14em] uppercase transition-colors hover:bg-ink hover:text-cream"
                @click="downloadActive"
              >
                Download {{ activeFormat.label }}
              </button>
            </div>
            <p class="mt-2 font-mono text-[11px] text-ink-soft" aria-live="polite">{{ exportStatus }}</p>
          </section>

          <!-- Import package -->
          <section aria-label="Import package">
            <h3 class="font-mono text-[11px] tracking-[0.22em] uppercase text-ink-soft border-b border-rule pb-1.5 mb-3">Import Package</h3>
            <form class="space-y-3" @submit.prevent="onImport">
              <div>
                <label for="import-package" class="block font-serif italic text-sm text-ink-soft mb-1.5">
                  Paste a previously exported palette package JSON:
                </label>
                <textarea
                  id="import-package"
                  v-model="importText"
                  rows="5"
                  spellcheck="false"
                  class="w-full border bg-parchment p-3 font-mono text-[11px] leading-relaxed"
                  :class="importError ? 'border-error' : 'border-rule'"
                  :aria-invalid="importError ? 'true' : 'false'"
                  aria-describedby="import-error"
                  placeholder='{ "schemaVersion": 1, "library": "O&A Palette Library", ... }'
                ></textarea>
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  class="min-h-11 px-4 bg-oxblood text-cream font-mono text-[11px] tracking-[0.14em] uppercase transition-colors hover:bg-ink"
                >
                  Import Package
                </button>
                <label class="min-h-11 inline-flex items-center px-3 border border-rule font-mono text-[11px] tracking-[0.14em] uppercase cursor-pointer transition-colors hover:border-ink">
                  Or pick a file
                  <input type="file" accept=".json,application/json" class="sr-only" @change="onPickFile" />
                </label>
              </div>
              <p v-if="importError" id="import-error" class="font-mono text-[11px] text-error" role="alert">{{ importError }}</p>
              <p v-if="importSuccess" class="font-mono text-[11px] text-moss" role="status">{{ importSuccess }}</p>
            </form>
          </section>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePaletteStore } from '../stores/palette';
import { buildPalettePackage, palettePackageSchema } from '../paletteSchema';
import { slugify } from '../colorUtils';
import { useDialog, writeClipboard, downloadText } from '../composables/useDialog';

const store = usePaletteStore();
const rootRef = ref(null);
const open = computed(() => store.exportOpen);
useDialog(open, rootRef, { onClose: () => (store.exportOpen = false) });

const formats = [
  { id: 'css', label: 'CSS' },
  { id: 'utility-theme', label: 'Utility Theme' },
  { id: 'scss', label: 'SCSS' },
  { id: 'library-json', label: 'Package JSON' },
];

const activeFormat = computed(() => formats.find((f) => f.id === store.exportFormat) || formats[0]);

function artifactText(format) {
  const palettes = store.palettes;
  if (format === 'css') {
    let out = '/* O&A Palette Library — exported CSS custom properties */\n';
    for (const p of palettes) {
      out += `\n/* ${p.name} — ${p.period} */\n.palette-${slugify(p.name)} {\n`;
      p.swatches.forEach((hex, i) => {
        out += `  --swatch-${i + 1}: ${hex};\n`;
      });
      out += '}\n';
    }
    return out;
  }
  if (format === 'utility-theme') {
    let out = '// O&A Palette Library — theme.extend.colors\nexport const theme = {\n  extend: {\n    colors: {\n';
    for (const p of palettes) {
      out += `      '${slugify(p.name)}': [${p.swatches.map((s) => `'${s}'`).join(', ')}], // ${p.name}\n`;
    }
    out += '    },\n  },\n};\n';
    return out;
  }
  if (format === 'scss') {
    let out = '// O&A Palette Library — $palettes map\n$palettes: (\n';
    for (const p of palettes) {
      out += `  '${slugify(p.name)}': (${p.swatches.join(', ')}), // ${p.name}\n`;
    }
    out += ');\n';
    return out;
  }
  return JSON.stringify(buildPalettePackage(palettes), null, 2);
}

const exportStatus = ref('');

async function copyActive() {
  const ok = await writeClipboard(artifactText(store.exportFormat));
  exportStatus.value = ok
    ? `Copied the ${activeFormat.value.label} preview to the clipboard.`
    : 'Clipboard unavailable — use Download instead.';
}

function downloadActive() {
  const names = { css: 'oa-palettes.css', 'utility-theme': 'oa-theme.js', scss: 'oa-palettes.scss', 'library-json': 'palette-package.json' };
  const mimes = { css: 'text/css', 'utility-theme': 'text/javascript', scss: 'text/x-scss', 'library-json': 'application/json' };
  downloadText(artifactText(store.exportFormat), names[store.exportFormat], mimes[store.exportFormat]);
  exportStatus.value = `Downloaded ${names[store.exportFormat]}.`;
}

const importText = ref('');
const importError = ref('');
const importSuccess = ref('');

function onPickFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    importText.value = String(reader.result || '');
  };
  reader.readAsText(file);
  event.target.value = '';
}

function onImport() {
  importError.value = '';
  importSuccess.value = '';
  let parsed;
  try {
    parsed = JSON.parse(importText.value);
  } catch {
    importError.value = 'Invalid package: the text is not valid JSON. Nothing was changed.';
    return;
  }
  const result = palettePackageSchema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue.path.length ? issue.path.join('.') : 'document';
    importError.value = `Invalid package: ${where} — ${issue.message}. Nothing was changed.`;
    return;
  }
  store.replacePalettes(result.data.palettes);
  importSuccess.value = `Imported ${result.data.palettes.length} palettes. The library, counts, and every export now match the package.`;
  importText.value = '';
  store.announce(`Imported ${result.data.palettes.length} palettes from the package`);
}
</script>
