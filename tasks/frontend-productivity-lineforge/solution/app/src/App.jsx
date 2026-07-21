import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import './index.css';

import {
  currentOpening, openingFamilies, filteredOpenings, favorites, savedLines,
  boardTheme, boardFlipped, searchQuery, showFavoritesOnly,
  practiceActive, userLine, activeGame, showSavedPanel, saveFormOpen,
  getNodeMoves, scrubberSequence, stepPrev, stepNext, resetToStart,
  toggleFavorite, toggleAllFavorites, loadOpening, setBoardTheme, startPractice, exitPractice,
  clearBoardInteraction, boardSelection, showExportCenter,
  canUndo, canRedo, undo, redo, paletteOpen,
  blindfoldActive, blindfoldPeek,
  buildSharePayload, encodeShareHash, parseShareHash, applySharePayload, showToast
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
import { CommandPalette } from './components/CommandPalette';
import { Coachmarks } from './components/Coachmarks';
import { MoveEntry } from './components/MoveEntry';
import { Icon } from './icons';
import { soundsOn, toggleSounds } from './sound';
import { OPENINGS } from './openings';

const THEMES = [
  { id: 'classic', label: 'Classic' },
  { id: 'forest', label: 'Forest' },
  { id: 'slate', label: 'Slate' }
];

function Header() {
  const share = () => {
    const payload = buildSharePayload();
    if (!payload) {
      showToast('Load an opening before sharing a study link');
      return;
    }
    const hash = encodeShareHash(payload);
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    const finish = (ok) => {
      if (ok) {
        try { window.location.hash = hash.slice(1); } catch { /* ignore */ }
        showToast('Study link copied to clipboard');
      } else {
        showToast('Could not copy study link');
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => finish(true), () => finish(false));
    } else {
      finish(false);
    }
  };

  return (
    <header class="bg-[var(--color-primary)] text-white px-4 py-3 flex items-center justify-between flex-wrap gap-3">
      <h1 class="app-title">
        <span class="text-[var(--color-accent)]">Line</span>Forge
      </h1>
      <div class="flex items-center gap-2 flex-wrap">
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
          onClick={undo}
          disabled={!canUndo.value}
          aria-label="Undo last change"
          title="Undo (Ctrl/Cmd+Z)"
        >
          <Icon name="undo" size={18} /> Undo
        </button>
        <button
          type="button"
          class="header-btn"
          onClick={redo}
          disabled={!canRedo.value}
          aria-label="Redo change"
          title="Redo (Ctrl/Cmd+Shift+Z)"
        >
          <Icon name="redo" size={18} /> Redo
        </button>
        <button
          type="button"
          class="header-btn"
          onClick={() => { paletteOpen.value = true; }}
          aria-label="Open command palette"
          title="Command palette (Ctrl/Cmd+K)"
        >
          <Icon name="command" size={18} /> Command palette
        </button>
        <button
          type="button"
          id="coach-export"
          class="header-btn"
          onClick={() => { showExportCenter.value = true; }}
        >
          <Icon name="export" size={18} /> Export center
        </button>
        <button
          type="button"
          class="header-btn"
          onClick={() => { showSavedPanel.value = !showSavedPanel.value; }}
        >
          <Icon name="save" size={18} /> View saved lines ({savedLines.value.length})
        </button>
        <button
          type="button"
          class="header-btn"
          onClick={share}
          aria-label="Copy shareable study link"
          title="Copy shareable study link"
        >
          <Icon name="link" size={18} /> Share link
        </button>
        <button
          type="button"
          class="header-btn"
          onClick={toggleSounds}
          aria-label={soundsOn.value ? 'Mute sound cues' : 'Enable sound cues'}
          aria-pressed={soundsOn.value}
          title="Toggle move and practice sound cues"
        >
          <Icon name={soundsOn.value ? 'soundOn' : 'soundOff'} size={18} />
          {soundsOn.value ? 'Sounds on' : 'Sounds off'}
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
    <article class={`opening-item flex items-start gap-1 rounded-md ${isActive ? 'opening-active' : ''}`}>
      <button
        type="button"
        class={`star-btn ${isFav ? 'star-on' : 'star-off'}`}
        onClick={() => toggleFavorite(opening.id)}
        aria-label={isFav ? `Unfavorite ${opening.name}` : `Favorite ${opening.name}`}
        aria-pressed={isFav}
      >
        <Icon name="star" size={20} filled={isFav} />
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
    </article>
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
    <section class="card flex flex-col" aria-labelledby="library-heading">
      <h2 id="library-heading" class="mb-3">Opening Library</h2>
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
      <div class="overflow-y-auto flex-1 space-y-1 library-list" style="max-height: 62vh;">
        {noResults && favoritesEmpty && (
          <p class="text-base text-neutral-700 empty-state-msg">
            No favorites yet. Select the star beside an opening to add it here, then use Show favorites only to study just those openings.
          </p>
        )}
        {noResults && !favoritesEmpty && (
          <p class="text-base text-neutral-700 empty-state-msg">
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
    <div class="flex flex-wrap gap-2 mt-3 board-controls">
      <button
        type="button"
        class="btn-secondary board-control-btn"
        onClick={() => { boardFlipped.value = !boardFlipped.value; }}
      >
        <Icon name="flip" size={16} /> Flip board
      </button>
      <button type="button" class="btn-secondary board-control-btn" onClick={resetToStart}>
        Reset to start
      </button>
      <button
        type="button"
        class="btn-secondary board-control-btn"
        onClick={stepPrev}
        disabled={prevDisabled}
      >
        <Icon name="arrowLeft" size={16} /> Previous move
      </button>
      <button
        type="button"
        class="btn-secondary board-control-btn"
        onClick={stepNext}
        disabled={nextDisabled}
        title={practiceActive.value && !game ? 'Unavailable during practice' : undefined}
      >
        Next move <Icon name="arrowRight" size={16} />
      </button>
      <button
        type="button"
        class={`btn-secondary board-control-btn ${blindfoldActive.value ? 'filter-on' : ''}`}
        onClick={() => { blindfoldActive.value = !blindfoldActive.value; blindfoldPeek.value = false; }}
        aria-pressed={blindfoldActive.value}
      >
        <Icon name="eye" size={16} /> Blindfold
      </button>
      {blindfoldActive.value && (
        <button
          type="button"
          class="btn-secondary board-control-btn"
          onClick={() => { blindfoldPeek.value = !blindfoldPeek.value; }}
          aria-pressed={blindfoldPeek.value}
        >
          {blindfoldPeek.value ? 'Hide pieces' : 'Peek'}
        </button>
      )}
    </div>
  );
}

function BoardCard() {
  const opening = currentOpening.value;
  const isFav = favorites.value.includes(opening.id);

  return (
    <section class="card" aria-labelledby="board-heading">
      <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <h2 id="board-heading">{opening.name}</h2>
        <div class="flex items-center gap-2">
          <span class="mode-chip">{practiceActive.value ? 'Practice mode' : 'Explore mode'}</span>
          <button
            type="button"
            class={`star-btn ${isFav ? 'star-on' : 'star-off'}`}
            onClick={() => toggleFavorite(opening.id)}
            aria-label={isFav ? `Unfavorite ${opening.name}` : `Favorite ${opening.name}`}
            aria-pressed={isFav}
          >
            <Icon name="star" size={20} filled={isFav} />
          </button>
        </div>
      </div>
      <ChessBoard />
      <BoardControls />
      <MoveEntry />
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
    <section class="card mt-4" aria-labelledby="practice-heading">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <h3 id="practice-heading">Practice</h3>
        <button
          type="button"
          id="coach-practice"
          class={practiceActive.value ? 'btn-secondary' : 'btn-primary'}
          onClick={() => {
            if (practiceActive.value) exitPractice();
            else startPractice();
          }}
        >
          <Icon name="practice" size={16} />
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
    const payload = parseShareHash(window.location.hash || '');
    if (payload) applySharePayload(payload);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      const tag = (e.target && e.target.tagName) || '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable);

      if (mod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        paletteOpen.value = true;
        return;
      }
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        if (typing) return;
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (e.key !== 'Escape') return;
      if (paletteOpen.value) {
        paletteOpen.value = false;
      } else if (showExportCenter.value) {
        showExportCenter.value = false;
      } else if (showSavedPanel.value) {
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
              <nav aria-label="Opening Library">
                <LibraryPanel />
              </nav>
              <section class="card flex items-center justify-center min-h-[300px]" aria-label="Board explorer placeholder">
                <div class="text-center text-neutral-600">
                  <div class="text-6xl mb-3" aria-hidden="true">♔</div>
                  <p class="text-base">Select an opening to see the board</p>
                </div>
              </section>
            </div>
            <aside class="mt-4" aria-label="Live relay">
              <LiveRelay />
            </aside>
          </div>
        ) : (
          <div class="max-w-7xl mx-auto">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <nav class="lg:col-span-3 order-2 lg:order-1" aria-label="Opening Library">
                <LibraryPanel />
              </nav>
              <section class="lg:col-span-5 order-1 lg:order-2" aria-label="Board explorer">
                <BoardCard />
                <PracticeCard />
              </section>
              <aside class="lg:col-span-4 order-3" aria-label="Study panels">
                <MoveTree />
                <StatsPanel />
                <NotableGames />
                <LiveRelay />
              </aside>
            </div>
          </div>
        )}
      </main>
      {showSavedPanel.value && <SavedLinesPanel />}
      {showExportCenter.value && <ExportCenter />}
      <CommandPalette />
      <Coachmarks />
      <Toast />
    </div>
  );
}
