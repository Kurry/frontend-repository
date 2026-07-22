<template>
  <div>
    <p v-if="pairs.length === 0" class="font-serif italic text-sm text-ink-soft border border-dashed border-rule p-4">
      This palette has fewer than two distinct swatch hexes, so no contrast ratios can be
      computed. Add or edit swatches until at least two unique hex values exist.
    </p>

    <div v-else class="overflow-auto max-h-80 border border-rule">
      <table class="w-full text-left border-collapse">
        <caption class="sr-only">WCAG contrast ratios for every unique swatch pairing</caption>
        <thead class="sticky top-0 bg-parchment">
          <tr class="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft">
            <th scope="col" class="px-3 py-2 border-b border-ink">Text on background</th>
            <th scope="col" class="px-3 py-2 border-b border-ink">Ratio</th>
            <th scope="col" class="px-3 py-2 border-b border-ink">AA 4.5:1</th>
            <th scope="col" class="px-3 py-2 border-b border-ink">AAA 7:1</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="pair in pairs"
            :key="pair.key"
            class="border-b border-rule transition-colors duration-200 hover:bg-parchment"
          >
            <td class="px-3 py-2">
              <span
                class="inline-block px-2.5 py-1 font-mono text-[11px] uppercase border border-ink/20 swatch-surface"
                :style="{ backgroundColor: pair.bg, color: pair.fg }"
              >
                {{ pair.fgHex }} on {{ pair.bgHex }}
              </span>
            </td>
            <td class="px-3 py-2 font-mono text-xs font-bold">{{ pair.ratio.toFixed(1) }}:1</td>
            <td class="px-3 py-2">
              <span class="mark" :class="pair.aa ? 'mark-pass' : 'mark-fail'">{{ pair.aa ? 'Pass' : 'Fail' }}</span>
            </td>
            <td class="px-3 py-2">
              <span class="mark" :class="pair.aaa ? 'mark-pass' : 'mark-fail'">{{ pair.aaa ? 'Pass' : 'Fail' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { contrastRatio, textOn } from '../colorUtils';

const props = defineProps({
  swatches: { type: Array, required: true },
});

const pairs = computed(() => {
  const unique = [];
  const seen = new Set();
  for (const hex of props.swatches) {
    const key = String(hex).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(String(hex).toUpperCase());
    }
  }
  const rows = [];
  for (let i = 0; i < unique.length; i++) {
    for (let j = 0; j < unique.length; j++) {
      if (i === j) continue;
      const fgHex = unique[i];
      const bgHex = unique[j];
      const ratio = contrastRatio(fgHex, bgHex);
      rows.push({
        key: `${fgHex}-${bgHex}`,
        fgHex,
        bgHex,
        fg: textOn(bgHex),
        bg: bgHex,
        ratio,
        aa: ratio >= 4.5,
        aaa: ratio >= 7,
      });
    }
  }
  return rows.sort((a, b) => b.ratio - a.ratio);
});
</script>

<style scoped>
.mark {
  display: inline-block;
  min-width: 3.2rem;
  text-align: center;
  padding: 0.2rem 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: 1px solid currentColor;
}
.mark-pass {
  color: var(--color-moss);
  background: rgba(74, 93, 35, 0.1);
}
.mark-fail {
  color: var(--color-error);
  background: rgba(163, 44, 30, 0.08);
}
</style>
