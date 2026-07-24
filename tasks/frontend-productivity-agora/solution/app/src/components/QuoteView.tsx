import { createMemo } from "solid-js";
import { store, QUOTES, nextQuote, toggleFavorite } from "../store";
import { showToast } from "./Toast";

export function QuoteView() {
  const quote = createMemo(() => QUOTES[store.currentQuoteIndex]);
  const isFavorited = createMemo(() => store.favoriteQuoteIds.includes(store.currentQuoteIndex));

  function handleFavorite() {
    const nowFav = !isFavorited();
    toggleFavorite(store.currentQuoteIndex);
    showToast(nowFav ? "Added to favorites!" : "Removed from favorites.");
  }

  return (
    <div
      class="rounded-lg p-6 flex flex-col gap-4"
      style="background: #0b1e27; border: 1px solid #1e3a4a;"
    >
      <p class="italic leading-snug" style="font-size: 22px; color: #cbd5e1;">
        &ldquo;{quote().text}&rdquo;
      </p>
      <p style="font-size: 16px; color: var(--color-accent);">— {quote().author}</p>
      <div class="flex gap-3 flex-wrap">
        <button
          class="btn px-4 py-2 text-white"
          style="background: var(--color-primary); font-size: 16px;"
          onClick={nextQuote}
        >
          New Quote
        </button>
        <button
          class="btn px-4 py-2"
          style={`font-size: 16px; background: ${isFavorited() ? "#854d0e" : "#1e3a4a"}; color: ${isFavorited() ? "#fde68a" : "#94a3b8"}; border: 1px solid ${isFavorited() ? "#92400e" : "#2d4e62"};`}
          onClick={handleFavorite}
          aria-pressed={isFavorited()}
        >
          {isFavorited() ? "★ Favorited" : "☆ Favorite"}
        </button>
      </div>
    </div>
  );
}
