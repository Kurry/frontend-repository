import { createMemo } from "solid-js";
import { store, QUOTES, toggleFavorite } from "../store";
import { showToast } from "./Toast";

export function FavoritesView() {
  const favorites = createMemo(() =>
    store.favoriteQuoteIds
      .filter(id => id >= 0 && id < QUOTES.length)
      .map(id => ({ id, ...QUOTES[id] }))
  );

  return (
    <div class="flex flex-col gap-4">
      <h2 style="font-size: 32px; color: #e2e8f0; font-weight: 700; margin: 0;">Favorite Quotes</h2>

      {favorites().length === 0 ? (
        <div
          class="rounded-lg p-8 text-center"
          style="background: #0b1e27; border: 1px solid #1e3a4a; color: #64748b; font-size: 18px;"
        >
          <p>No favorites yet.</p>
          <p style="margin-top: 8px; font-size: 16px;">Heart a quote on the Home tab to save it here.</p>
        </div>
      ) : (
        <div class="flex flex-col gap-3">
          {favorites().map(q => (
            <div
              class="rounded-lg p-5 flex flex-col gap-3"
              style="background: #0b1e27; border: 1px solid #1e3a4a;"
            >
              <p class="italic" style="font-size: 18px; color: #cbd5e1;">&ldquo;{q.text}&rdquo;</p>
              <p style="font-size: 14px; color: var(--color-accent);">— {q.author}</p>
              <button
                class="btn px-3 py-1 self-start"
                style="font-size: 14px; background: #7f1d1d; color: #fca5a5;"
                onClick={() => {
                  toggleFavorite(q.id);
                  showToast("Removed from favorites.");
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
