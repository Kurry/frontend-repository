import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import './index.css';

import {
  currentOpening, openingFamilies, filteredOpenings, favorites, savedLines,
  boardTheme, boardFlipped, selectedNodeId, searchQuery, showFavoritesOnly,
  practiceActive, userLine, activeGame, showSavedPanel, saveFormOpen,
  getNodeMoves, scrubberSequence, stepPrev, stepNext, resetToStart,
  toggleFavorite, toggleAllFavorites, loadOpening, setBoardTheme, startPractice, exitPractice,
  clearBoardInteraction, boardSelection, showExportCenter
} from './store';

import { ChessBoard } from './components/ChessBoard';
import { MoveTree } from './components/MoveTree';
import { StatsPanel } from './components/StatsPanel';
import { NotableGames } from './components/NotableGames';
import { SavedLinesPanel } from './components/SavedLinesPanel';
import { PracticePanel } from './components/PracticePanel';
import { LiveRelay } from './components/LiveRelay';
import { ExportCenter } from './components/ExportCenter';
import { Toast } from './components/Toast';
import { OPENINGS } from './openings';

const THEMES = [
  { id: 'classic', label: 'Classic' },
  { id: 'forest', label: 'Forest' },
  { id: 'slate', label: 'Slate' }
];

function Header() {
  return (
    <header class="bg-[var(--color-primary)] text-white px-4 py-3 flex items-center justify-between flex-wrap gap-3">
      <h1 class="app-title">
        <span class="text-[var(--color-accent)]">Line</span>Forge
      </h1>
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex items-center gap-2">
          <label class="text-base" for="board-theme">Board theme</label>
          <select
            id="board-theme"
            value={boardTheme.value}
            onChange={e => setBoardTheme(e.target.value)}
            class="theme-select"
          >
            {THEMES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          class="header-btn"
          onClick={() => { showExportCenter.value = true; }}
        >
          Export center
        </button>
        <button
          type="button"
          class="header-btn"
          onClick={() => { showSavedPanel.value = !showSavedPanel.value; }}
        >
          View saved lines ({savedLines.value.length})
        </button>
      </div>
    </header>
  );
}

function formatMovePreview(moves) {
  let out = '';
  moves.forEach((san, i) => {
    const num = Math.floor(i / 2) + 1;
    out += (i > 0 ? ' ' : '') + (i % 2 === 0 ? `${num}. ` : '') + san;
  });
  return out;
}

function OpeningItem({ opening }) {
  const isFav = favorites.value.includes(opening.id);
  const isActive = currentOpening.value?.id === opening.id;
  const hideMoves = practiceActive.value && isActive;

  return (
    <div class={`flex items-start gap-1 rounded-md ${isActive ? 'opening-active' : ''}`}>
      <button
        type="button"
        class={`star-btn ${isFav ? 'star-on' : 'star-off'}`}
        onClick={() => toggleFavorite(opening.id)}
        aria-label={isFav ? `Unfavorite ${opening.name}` : `Favorite ${opening.name}`}
        aria-pressed={isFav}
      >
        <span aria-hidden="true">{isFav ? '★' : '☆'}</span>
      </button>
      <button
        type="button"
        class="opening-load flex-1 text-left"
        onClick={() => loadOpening(opening.id)}
      >
        <span class={`block text-base ${isActive ? 'font-semibold' : ''}`}>
          {opening.name} <span class="text-sm text-neutral-600 stat-figures">{opening.code}</span>
        </span>
        <span class="block text-sm text-neutral-600 mt-0.5">
          {hideMoves ? 'Moves hidden during practice' : formatMovePreview(opening.moves)}
        </span>
      </button>
    </div>
  );
}

function LibraryPanel() {
  const families = openingFamilies.value;
  const noResults = Object.keys(families).length === 0;
  const favoritesEmpty = showFavoritesOnly.value && favorites.value.length === 0;

  const onSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = filteredOpenings.value[0];
      if (first) loadOpening(first.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      searchQuery.value = '';
      e.currentTarget.blur();
    }
  };

  return (
    <section class="card flex flex-col">
      <h2 class="mb-3">Opening library</h2>
      <div class="mb-2">
        <label class="block text-sm font-medium mb-1" for="opening-search">Search openings</label>
        <input
          id="opening-search"
          type="text"
          placeholder="Name, code or family"
          value={searchQuery.value}
          onInput={e => { searchQuery.value = e.target.value; }}
          onKeyDown={onSearchKeyDown}
          class="text-input w-full"
        />
      </div>
      <div class="mb-3">
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class={`btn-secondary btn-compact ${showFavoritesOnly.value ? 'filter-on' : ''}`}
            onClick={() => { showFavoritesOnly.value = !showFavoritesOnly.value; }}
            aria-pressed={showFavoritesOnly.value}
          >
            <span aria-hidden="true">★ </span>Show favorites only ({favorites.value.length})
          </button>
          <button
            type="button"
            class="btn-secondary btn-compact"
            onClick={toggleAllFavorites}
          >
            {favorites.value.length === OPENINGS.length
              ? 'Clear favorites'
              : 'Favorite all'}
          </button>
        </div>
      </div>
      <div class="overflow-y-auto flex-1 space-y-1" style="max-height: 62vh;">
        {noResults && favoritesEmpty && (
          <p class="text-base text-neutral-700">
            No favorites yet. Select the star beside an opening to add it here.
          </p>
        )}
        {noResults && !favoritesEmpty && (
          <p class="text-base text-neutral-700">
            No openings match your search. Try a different name, code or family.
          </p>
        )}
        {Object.entries(families).map(([family, openings]) => (
          <div key={family}>
            <h3 class="family-heading">{family}</h3>
            <ul class="list-none m-0 p-0 space-y-1">
              {openings.map(o => (
                <li key={o.id}><OpeningItem opening={o} /></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function BoardControls() {
  const game = activeGame.value;
  const path = getNodeMoves();
  const seq = scrubberSequence();

  const prevDisabled = game ? game.index <= -1 : path.length === 0;
  const nextDisabled = game
    ? game.index >= game.moves.length - 1
    : (practiceActive.value || path.length >= seq.length);

  return (
    <div class="flex flex-wrap gap-2 mt-3">
      <button
        type="button"
        class="btn-secondary"
        onClick={() => { boardFlipped.value = !boardFlipped.value; }}
      >
        Flip board
      </button>
      <button type="button" class="btn-secondary" onClick={resetToStart}>
        Reset to start
      </button>
      <button
        type="button"
        class="btn-secondary"
        onClick={stepPrev}
        disabled={prevDisabled}
      >
        Previous move
      </button>
      <button
        type="button"
        class="btn-secondary"
        onClick={stepNext}
        disabled={nextDisabled}
        title={practiceActive.value && !game ? 'Unavailable during practice' : undefined}
      >
        Next move
      </button>
    </div>
  );
}

function BoardCard() {
  const opening = currentOpening.value;
  const isFav = favorites.value.includes(opening.id);

  return (
    <section class="card">
      <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <h2>{opening.name}</h2>
        <div class="flex items-center gap-2">
          <span class="mode-chip">{practiceActive.value ? 'Practice mode' : 'Explore mode'}</span>
          <button
            type="button"
            class={`star-btn ${isFav ? 'star-on' : 'star-off'}`}
            onClick={() => toggleFavorite(opening.id)}
            aria-label={isFav ? `Unfavorite ${opening.name}` : `Favorite ${opening.name}`}
            aria-pressed={isFav}
          >
            <span aria-hidden="true">{isFav ? '★' : '☆'}</span>
          </button>
        </div>
      </div>
      <ChessBoard />
      <BoardControls />
      {userLine.value && !practiceActive.value && (
        <div class="new-line-badge mt-3" role="status">
          New Line
        </div>
      )}
    </section>
  );
}

function PracticeCard() {
  return (
    <section class="card mt-4">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <h3>Practice</h3>
        <button
          type="button"
          class={practiceActive.value ? 'btn-secondary' : 'btn-primary'}
          onClick={() => {
            if (practiceActive.value) exitPractice();
            else startPractice();
          }}
        >
          {practiceActive.value ? 'Exit practice' : 'Practice this line'}
        </button>
      </div>
      {practiceActive.value && <PracticePanel />}
    </section>
  );
}

export function App() {
  const opening = currentOpening.value;

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (showSavedPanel.value) {
        showSavedPanel.value = false;
      } else if (saveFormOpen.value) {
        saveFormOpen.value = false;
      } else if (boardSelection.value) {
        clearBoardInteraction();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div class={`min-h-screen flex flex-col theme-${boardTheme.value}`}>
      <Header />
      <main class="flex-1 p-3 md:p-4">
        {!opening ? (
          <div class="max-w-4xl mx-auto">
            <div class="text-center py-10">
              <h2 class="welcome-title mb-4">
                Welcome to <span class="text-[var(--color-accent)]">Line</span>Forge
              </h2>
              <p class="text-base text-neutral-700 mb-8 max-w-md mx-auto">
                Select an opening from the library to begin studying. Explore move trees, practice from memory and build your repertoire.
              </p>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <LibraryPanel />
              <section class="card flex items-center justify-center min-h-[300px]">
                <div class="text-center text-neutral-600">
                  <div class="text-6xl mb-3" aria-hidden="true">♔</div>
                  <p class="text-base">Select an opening to see the board</p>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div class="max-w-7xl mx-auto">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div class="lg:col-span-3 order-2 lg:order-1">
                <LibraryPanel />
              </div>
              <div class="lg:col-span-5 order-1 lg:order-2">
                <BoardCard />
                <PracticeCard />
              </div>
              <div class="lg:col-span-4 order-3">
                <MoveTree />
                <StatsPanel />
                <NotableGames />
                <LiveRelay />
              </div>
            </div>
          </div>
        )}
      </main>
      {showSavedPanel.value && <SavedLinesPanel />}
      {showExportCenter.value && <ExportCenter />}
      <Toast />
    </div>
  );
}
