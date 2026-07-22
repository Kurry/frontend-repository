<script setup>
import { computed } from 'vue'
import { NButton } from 'naive-ui'
import IconBraces from '~icons/lucide/braces'
import IconCheck from '~icons/lucide/check'
import IconClipboard from '~icons/lucide/clipboard'
import IconDownload from '~icons/lucide/download'
import IconFileText from '~icons/lucide/file-text'
import IconPackage from '~icons/lucide/package-check'
import IconRefresh from '~icons/lucide/refresh-cw'
import { useQcStore } from '../store'

const store = useQcStore()
const preview = computed(() => store.exportPreview)

const copyExport = () => store.copyExport()
const downloadExport = () => store.downloadExport()
</script>

<template>
  <main class="view-shell export-view" aria-labelledby="export-heading">
    <section class="export-intro">
      <div><div class="eyebrow"><span class="live-dot"></span> Session-synchronized artifact</div><h1 id="export-heading">QC package export</h1><p>Every approved stage, payout hold, finding, and override is compiled live from this browser session.</p></div>
      <div class="artifact-status"><IconPackage /><span><strong>Package ready</strong><small>Schema version 1 · {{ store.submissions.length }} records</small></span></div>
    </section>
    <section class="export-workspace">
      <div class="export-toolbar">
        <div class="format-switch" role="group" aria-label="Export format">
          <button :class="{ active: store.exportFormat === 'json' }" @click="store.exportFormat = 'json'"><IconBraces /> QC package <span>JSON</span></button>
          <button :class="{ active: store.exportFormat === 'markdown' }" @click="store.exportFormat = 'markdown'"><IconFileText /> QC report <span>MARKDOWN</span></button>
        </div>
        <div class="export-actions">
          <span class="live-sync" aria-live="polite"><IconRefresh /> Live from session</span>
          <NButton @click="copyExport" aria-live="polite"><IconCheck v-if="store.copyConfirmed" class="copy-success" /><IconClipboard v-else />{{ store.copyConfirmed ? 'Copied!' : 'Copy export' }}</NButton>
          <NButton type="primary" @click="downloadExport"><IconDownload /> Download {{ store.exportFormat === 'json' ? '.json' : '.md' }}</NButton>
        </div>
      </div>
      <div class="code-window">
        <div class="code-titlebar" aria-live="polite"><span><i></i><i></i><i></i></span><strong>{{ store.exportFormat === 'json' ? 'arcfield-qc-package.json' : 'arcfield-qc-report.md' }}</strong><small>{{ preview.length.toLocaleString() }} characters</small></div>
        <pre tabindex="0" :aria-label="`${store.exportFormat} export preview`"><code>{{ preview }}</code></pre>
      </div>
      <div class="contract-strip">
        <span>Validated output contract</span>
        <div><code>schemaVersion: 1</code><code>gate_status</code><code>open_finding_counts</code><code>history[]</code></div>
      </div>
    </section>
  </main>
</template>
