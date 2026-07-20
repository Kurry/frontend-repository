import { component$, useContext } from '@builder.io/qwik';
import { GlobalStoreContext } from '../../store';
import { saveState } from '../../utils/undo-redo';

export const PaletteView = component$(() => {
  const store = useContext(GlobalStoreContext);

  let visiblePalettes = store.palettes.filter(p => !p.archived);

  if (store.periodFilter) {
    visiblePalettes = visiblePalettes.filter(p => p.period === store.periodFilter);
  }

  if (store.nameSort === 'name-asc') {
    visiblePalettes.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    visiblePalettes.sort((a, b) => b.name.localeCompare(a.name));
  }

  return (
    <div id="palette-view" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="tabpanel">
      {visiblePalettes.map(card => (
        <article key={card.id} class="palette-card border border-gray-200 bg-white shadow-sm flex flex-col" data-period={card.period}>
          <div class="palette-card__swatches flex h-32 w-full">
            {card.swatches.map((hex, i) => (
              <button
                key={i}
                type="button"
                class="palette-card__swatch flex-1 transition-transform hover:scale-105 origin-bottom relative group"
                style={{ backgroundColor: hex }}
                data-hex={hex}
                title={hex}
                onClick$={() => {
                  navigator.clipboard.writeText(hex);
                  store.copyFeedback = hex;
                  setTimeout(() => store.copyFeedback = null, 1000);
                }}
              >
                <span class="palette-card__swatch-hex absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-mono opacity-0 group-hover:opacity-100 bg-black/50 text-white px-1 rounded transition-opacity pointer-events-none">
                  {hex}
                </span>
                {store.copyFeedback === hex && (
                  <span class="absolute inset-0 flex items-center justify-center bg-white/20 text-white text-xs font-bold drop-shadow-md">
                    Copied
                  </span>
                )}
              </button>
            ))}
          </div>
          <div class="palette-card__meta p-4 flex flex-col gap-2 flex-1">
            <div class="palette-card__meta-row flex justify-between items-baseline gap-2">
              <span class="palette-card__meta-label text-xs uppercase tracking-widest text-gray-500">title</span>
              <button
                type="button"
                class="palette-card__meta-title text-left font-serif font-bold text-lg hover:underline decoration-1 underline-offset-4"
                onClick$={() => store.selectionId = card.id}
              >
                {card.name}
              </button>
            </div>
            <div class="palette-card__meta-row flex justify-between items-baseline gap-2">
              <span class="palette-card__meta-label text-xs uppercase tracking-widest text-gray-500">artist</span>
              <span class="palette-card__meta-artist text-right text-sm">{card.artist}</span>
            </div>
            <div class="palette-card__meta-row flex justify-between items-baseline gap-2">
              <span class="palette-card__meta-label text-xs uppercase tracking-widest text-gray-500">period</span>
              <span class="palette-card__meta-artist text-right text-sm italic">{card.period}</span>
            </div>
          </div>
          <div class="border-t border-gray-100 p-2 flex justify-end gap-2 bg-gray-50">
             <button class="btn btn-xs btn-ghost text-gray-500 hover:text-black" onClick$={() => {
                 saveState(store);
                 const newP = {...card, favorite: !card.favorite};
                 store.palettes = store.palettes.map(p => p.id === card.id ? newP : p);
             }}>
                {card.favorite ? '★' : '☆'}
             </button>
             <button class="btn btn-xs btn-ghost text-gray-500 hover:text-red-600" onClick$={() => {
                if(confirm('Delete palette?')) {
                  saveState(store);
                  store.palettes = store.palettes.filter(p => p.id !== card.id);
                  if (store.selectionId === card.id) {
                    store.selectionId = null;
                  }
                }
             }}>
               Delete
             </button>
          </div>
        </article>
      ))}
    </div>
  );
});
