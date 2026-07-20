<template>
  <div id="export-drawer" class="max-w-5xl mx-auto px-4 py-8 border-t border-gray-200">
    <div class="flex justify-between items-center mb-6">
      <h2 class="font-sans text-xl font-medium">Export / Import Package</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h3 class="font-sans font-medium mb-2 text-sm">Export Library</h3>
        <select v-model="exportFormat" class="border border-gray-300 rounded px-3 py-1 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-black mb-3 w-full">
          <option value="css">CSS Variables</option>
          <option value="utility-theme">Utility Theme (JS)</option>
          <option value="scss">SCSS Variables</option>
          <option value="library-json">Palette Package (JSON)</option>
        </select>
        <button @click="doExport" class="w-full bg-black text-white px-4 py-2 rounded font-sans text-sm hover:bg-gray-800 transition-colors">
          Download Artifact
        </button>
      </div>

      <div>
        <h3 class="font-sans font-medium mb-2 text-sm">Import Package (JSON)</h3>
        <form @submit.prevent="onImport" class="flex flex-col gap-3">
          <textarea
            v-model="importData"
            rows="3"
            class="border rounded px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-black"
            :class="{'border-red-500': importError, 'border-gray-300': !importError}"
            placeholder='Paste JSON here...'
          ></textarea>
          <p v-if="importError" class="text-red-500 text-xs font-sans" role="alert">{{ importError }}</p>
          <button type="submit" class="w-full border border-black text-black px-4 py-2 rounded font-sans text-sm hover:bg-gray-50 transition-colors">
            Import
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { usePaletteStore } from '../stores/palette';
import { buildPalettePackage, palettePackageSchema } from '../paletteSchema';

const store = usePaletteStore();
const exportFormat = ref('library-json');
const importData = ref('');
const importError = ref('');

function doExport() {
  const data = store.palettes;
  let content = '';
  let mimeType = 'text/plain';
  let filename = 'export.txt';

  if (exportFormat.value === 'library-json') {
    content = JSON.stringify(buildPalettePackage(data), null, 2);
    mimeType = 'application/json';
    filename = 'palettes.json';
  } else if (exportFormat.value === 'css') {
    content = ':root {\n';
    data.forEach((p, i) => {
      p.swatches.forEach((s, j) => {
        content += `  --color-${p.name.replace(/\s+/g, '-').toLowerCase()}-${j}: ${s};\n`;
      });
    });
    content += '}';
    filename = 'palettes.css';
    mimeType = 'text/css';
  } else if (exportFormat.value === 'scss') {
    data.forEach((p, i) => {
      p.swatches.forEach((s, j) => {
        content += `$color-${p.name.replace(/\s+/g, '-').toLowerCase()}-${j}: ${s};\n`;
      });
    });
    filename = 'palettes.scss';
  } else if (exportFormat.value === 'utility-theme') {
    content = 'module.exports = { theme: { extend: { colors: { \n';
    data.forEach((p, i) => {
      content += `  '${p.name.replace(/\s+/g, '-').toLowerCase()}': {\n`;
      p.swatches.forEach((s, j) => {
        content += `    '${(j + 1) * 100}': '${s}',\n`;
      });
      content += `  },\n`;
    });
    content += '} } } };';
    filename = 'theme.js';
    mimeType = 'text/javascript';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function onImport() {
  importError.value = '';
  try {
    const parsed = JSON.parse(importData.value);
    const result = palettePackageSchema.safeParse(parsed);
    if (!result.success) {
      const issue = result.error.issues[0];
      importError.value = `Invalid package: ${issue.path.join('.') || 'document'} ${issue.message}`;
      return;
    }
    store.replacePalettes(result.data.palettes);
    importData.value = '';
  } catch (e) {
    importError.value = 'Invalid JSON.';
  }
}
</script>
