import { oaColorName } from "../../utils/color-names";
import { component$, useContext } from '@builder.io/qwik';
import { GlobalStoreContext } from '../../store';
import { isLight, getContrastRatio } from '../../utils/colors';

export const SwatchView = component$(() => {
  const store = useContext(GlobalStoreContext);

  let visiblePalettes = store.palettes.filter(p => !p.archived);
  if (store.periodFilter) {
    visiblePalettes = visiblePalettes.filter(p => p.period === store.periodFilter);
  }

  const tiles: any[] = [];
  visiblePalettes.forEach((card) => {
    (card.swatches || []).forEach((hex) => {
      tiles.push({
        hex: hex,
        period: card.period,
        title: card.name,
      });
    });
  });

  return (
    <div id="swatch-view" class="palette-library__view palette-library__view--swatch grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0" role="tabpanel">
       {tiles.map((tile, i) => {
          const textColor = isLight(tile.hex) ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.82)";
          return (
             <button
                key={`${tile.hex}-${i}`}
                type="button"
                class="swatch-tile aspect-square flex flex-col justify-between p-3 text-left transition-transform hover:scale-105 hover:z-10 relative group border border-transparent hover:border-black/20"
                data-hex={tile.hex}
                data-period={tile.period}
                style={{ backgroundColor: tile.hex }}
                onClick$={() => {
                  navigator.clipboard.writeText(tile.hex);
                  store.copyFeedback = tile.hex;
                  setTimeout(() => store.copyFeedback = null, 1000);
                }}
             >
                <span class="swatch-tile__hex font-mono text-sm opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: textColor }}>{tile.hex}</span>
                <div class="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                  <span class="swatch-tile__name text-sm font-bold capitalize" style={{ color: textColor }}>{oaColorName(tile.hex).name}</span>
                  <span class="swatch-tile__title text-xs italic line-clamp-1" style={{ color: textColor }}>{tile.title}</span>
                </div>
                {store.copyFeedback === tile.hex && (
                  <span class="absolute inset-0 flex items-center justify-center bg-black/10 text-xl font-bold drop-shadow-md" style={{ color: textColor }}>
                    Copied
                  </span>
                )}
             </button>
          )
       })}
    </div>
  );
});
