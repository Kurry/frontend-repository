import { oaColorName } from "../../utils/color-names";
import { component$, useContext } from '@builder.io/qwik';
import { GlobalStoreContext } from '../../store';
import { hueSort } from '../../utils/colors';

export const NomenclatureView = component$(() => {
  const store = useContext(GlobalStoreContext);

  let visiblePalettes = store.palettes.filter(p => !p.archived);

  if (store.periodFilter) {
    visiblePalettes = visiblePalettes.filter(p => p.period === store.periodFilter);
  }

  // Build and deduplicate rows
  const rows: any[] = [];
  const seen = new Set<string>();

  visiblePalettes.forEach((card) => {
    (card.swatches || []).forEach((hex) => {
      const key = String(hex).toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      rows.push({
        hex: key,
        period: card.period,
        title: card.name,
        artist: card.artist,
      });
    });
  });

  // Sort deterministic
  rows.sort((a, b) => hueSort(a.hex) - hueSort(b.hex));

  return (
    <div id="nomenclature-view" class="palette-library__view palette-library__view--nomenclature" role="tabpanel">
       <div class="nomenclature-row nomenclature-row--header grid grid-cols-[3rem_6rem_minmax(120px,1fr)_minmax(120px,1fr)_minmax(200px,1fr)] gap-4 pb-2 border-b-2 border-black font-bold text-xs uppercase tracking-widest mb-4">
          <span></span>
          <span>Hex</span>
          <span>Name</span>
          <span>Notes</span>
          <span>Painting</span>
       </div>
       <div class="flex flex-col gap-2">
       {rows.map(row => (
         <div key={row.hex} class="nomenclature-row grid grid-cols-[3rem_6rem_minmax(120px,1fr)_minmax(120px,1fr)_minmax(200px,1fr)] gap-4 items-center py-2 border-b border-gray-200 hover:bg-white transition-colors" data-hex={row.hex} data-period={row.period}>
            <button
              type="button"
              class="nomenclature-swatch w-10 h-10 rounded-full border border-gray-300 relative"
              style={{ backgroundColor: row.hex }}
              data-hex={row.hex}
              title={`Click to copy ${row.hex}`}
              onClick$={() => {
                  navigator.clipboard.writeText(row.hex);
                  store.copyFeedback = row.hex;
                  setTimeout(() => store.copyFeedback = null, 1000);
              }}
            >
              {store.copyFeedback === row.hex && (
                  <span class="absolute inset-0 flex items-center justify-center bg-white/20 text-white text-xs font-bold drop-shadow-md rounded-full">
                    ✓
                  </span>
                )}
            </button>
            <span class="nomenclature-hex font-mono text-sm">{row.hex}</span>
            <span class="nomenclature-name text-sm capitalize" data-color-name>{oaColorName(row.hex).name}</span>
            <span class="nomenclature-note text-sm text-gray-500 italic truncate" data-color-note></span>
            <div class="nomenclature-source flex flex-col">
              <button type="button" class="nomenclature-source__title text-left font-serif font-bold text-sm hover:underline">{row.title}</button>
              <span class="nomenclature-source__artist text-xs text-gray-600">{row.artist}</span>
            </div>
         </div>
       ))}
       </div>
    </div>
  );
});
