import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import GameCanvas from './components/GameCanvas';
import WordTray from './components/WordTray';
import HUD from './components/HUD';
import Toast from './components/Toast';
import GameOver from './components/GameOver';
import MatchHistory from './components/MatchHistory';
import Achievements from './components/Achievements';
import { DIFFICULTY_TIERS } from './game/types';

const CANVAS_WIDTH = 340;
const CANVAS_HEIGHT = 480;

const App: React.FC = () => {
  const [shake, setShake] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(CANVAS_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(CANVAS_HEIGHT);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store selectors for UI rendering
  const gameStarted = useGameStore(state => state.gameStarted);
  const isPaused = useGameStore(state => state.isPaused);
  const isGameOver = useGameStore(state => state.isGameOver);
  const currentView = useGameStore(state => state.currentView);
  const selectedWord = useGameStore(state => state.selectedWord);
  const tiles = useGameStore(state => state.tiles);
  const gameMode = useGameStore(state => state.gameMode);
  const historyNodes = useGameStore(state => state.historyNodes);
  const currentHistoryNodeId = useGameStore(state => state.currentHistoryNodeId);
  const scenarioRevision = useGameStore(state => state.scenarioRevision);

  // Store actions
  const startGame = useGameStore(state => state.startGame);
  const setGameMode = useGameStore(state => state.setGameMode);
  const pauseGame = useGameStore(state => state.pauseGame);
  const resumeGame = useGameStore(state => state.resumeGame);
  const spawnTile = useGameStore(state => state.spawnTile);
  const updateTiles = useGameStore(state => state.updateTiles);
  const selectTile = useGameStore(state => state.selectTile);
  const deselectTile = useGameStore(state => state.deselectTile);
  const submitWord = useGameStore(state => state.submitWord);
  const undoLastTile = useGameStore(state => state.undoLastTile);
  const resetGame = useGameStore(state => state.resetGame);
  const setView = useGameStore(state => state.setView);
  const checkAchievements = useGameStore(state => state.checkAchievements);
  const undoAction = useGameStore(state => state.undoAction);
  const redoAction = useGameStore(state => state.redoAction);
  const applyScenarioChange = useGameStore(state => state.applyScenarioChange);
  const selectHistoryNode = useGameStore(state => state.selectHistoryNode);
  const saveCheckpoint = useGameStore(state => state.saveCheckpoint);
  const resumeCheckpoint = useGameStore(state => state.resumeCheckpoint);
  const hasCheckpoint = useGameStore(state => state.checkpoint !== null);

  // Responsive sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const w = Math.min(containerRef.current.offsetWidth - 32, CANVAS_WIDTH);
        const cw = Math.max(w, 200);
        setCanvasWidth(cw);
        setCanvasHeight(Math.round(cw * CANVAS_HEIGHT / CANVAS_WIDTH));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Game loop refs
  const lastFrameTime = useRef<number>(0);
  const spawnAccumulator = useRef<number>(0);
  const gameLoopRef = useRef<number>(0);
  const canvasWidthRef = useRef(CANVAS_WIDTH);

  useEffect(() => { canvasWidthRef.current = canvasWidth; }, [canvasWidth]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || isGameOver) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = 0;
      }
      return;
    }

    const loop = (timestamp: number) => {
      if (!lastFrameTime.current) lastFrameTime.current = timestamp;
      const dt = Math.min((timestamp - lastFrameTime.current) / 1000, 0.1);
      lastFrameTime.current = timestamp;

      const state = useGameStore.getState();
      if (!state.isPaused) {
        const tier = DIFFICULTY_TIERS[state.difficulty] || DIFFICULTY_TIERS[0];
        spawnAccumulator.current += dt * 1000;
        while (spawnAccumulator.current >= tier.spawnInterval) {
          spawnAccumulator.current -= tier.spawnInterval;
          spawnTile(canvasWidthRef.current);
        }
        updateTiles(dt);
      }

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = 0;
      }
    };
  }, [gameStarted, isGameOver, spawnTile, updateTiles]);

  // Periodic achievement check during active play
  useEffect(() => {
    if (!gameStarted || isPaused || isGameOver) return;
    const interval = setInterval(() => checkAchievements(), 10000);
    return () => clearInterval(interval);
  }, [gameStarted, isPaused, isGameOver, checkAchievements]);

  const handleTileClick = useCallback(
    (tileId: string) => {
      // Selecting is symmetric: clicking/tapping an already-selected tile
      // again reverses the selection through that same action, rather than
      // requiring a different control (Undo Last Tile) to undo it.
      const tile = useGameStore.getState().tiles.find(t => t.id === tileId);
      if (tile?.selected) {
        deselectTile(tileId);
      } else {
        selectTile(tileId);
      }
    },
    [selectTile, deselectTile]
  );

  const handleSubmitWord = useCallback(() => {
    const selectedCount = useGameStore.getState().selectedWord.length;
    const result = submitWord();
    if (!result && selectedCount >= 2) {
      setShake(true);
      window.setTimeout(() => setShake(false), 2500);
    }
  }, [submitWord]);

  const handleStartGame = useCallback(() => {
    startGame();
    lastFrameTime.current = 0;
    spawnAccumulator.current = 0;
  }, [startGame]);

  const handleRestart = useCallback(() => {
    resetGame();
    setTimeout(() => {
      startGame();
      lastFrameTime.current = 0;
      spawnAccumulator.current = 0;
    }, 100);
  }, [resetGame, startGame]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useGameStore.getState();

      // Escape dismisses the Pause overlay (the app's dialog-like surface)
      // regardless of which element currently has focus, including the
      // game board canvas which otherwise owns its own key handling.
      if (e.key === 'Escape') {
        if (state.isPaused) {
          e.preventDefault();
          resumeGame();
        }
        return;
      }

      const target = e.target;
      if (target instanceof HTMLElement && (target.tagName === 'BUTTON' || target.tagName === 'CANVAS')) {
        return;
      }
      if (!state.gameStarted || state.isGameOver) return;
      if (e.key === 'Enter') { e.preventDefault(); handleSubmitWord(); }
      else if (e.key === 'Backspace') { e.preventDefault(); undoLastTile(); }
      else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (state.isPaused) resumeGame(); else pauseGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmitWord, undoLastTile, pauseGame, resumeGame]);

  // Button styles. Background color for the plain (non-active-state) primary
  // and secondary buttons is owned by the .ld-btn-primary/.ld-btn-secondary
  // CSS classes (see index.css) rather than set here inline, so their
  // :hover/:focus-visible rules can actually take effect — an inline
  // `style.backgroundColor` always wins over any stylesheet rule (hover or
  // not), which is what previously made hover/focus feedback on these
  // buttons unreliable while the game loop kept re-rendering them.
  const primaryBtn: React.CSSProperties = {
    color: '#FEFEFE',
    border: 'none',
    borderRadius: '1000px',
    padding: '10px 24px',
    fontSize: '19px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    outline: 'none',
    minHeight: '48px',
  };

  const secondaryBtn: React.CSSProperties = {
    color: '#007AFF',
    border: '1px solid #66798B',
    borderRadius: '1000px',
    padding: '10px 24px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    outline: 'none',
    minHeight: '48px',
  };

  // Toggle-style buttons (view tabs, Solo/Challenge mode, branch selectors)
  // deliberately omit inline `color`/`backgroundColor`: both are owned by the
  // .ld-btn-toggle / .ld-btn-toggle-active CSS classes so their :hover and
  // :focus-visible rules can take effect (inline styles would always win
  // over stylesheet hover rules).
  const toggleBtn: React.CSSProperties = {
    border: '1px solid #66798B',
    borderRadius: '1000px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    outline: 'none',
    minHeight: '48px',
    padding: '10px 24px',
  };

  const canSubmit = gameStarted && !isPaused && selectedWord.length >= 2;
  const canUndo = gameStarted && !isPaused && selectedWord.length > 0;
  const canSaveProgress = gameStarted && !isGameOver && (useGameStore.getState().score > 0 || useGameStore.getState().tilesCleared > 0);
  const currentHistoryNode = historyNodes.find(node => node.id === currentHistoryNodeId);
  const parentHistoryNode = currentHistoryNode?.parentId
    ? historyNodes.find(node => node.id === currentHistoryNode.parentId)
    : undefined;
  const branchIds = parentHistoryNode?.children.length
    ? parentHistoryNode.children
    : currentHistoryNode?.children || [];
  const canUndoAction = Boolean(currentHistoryNode?.parentId);
  const canRedoAction = Boolean(currentHistoryNode?.children.length);

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 12px',
        maxWidth: '480px',
        margin: '0 auto',
        fontFamily: 'Arial, -apple-system, BlinkMacSystemFont, "Apple Color Emoji", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      <Toast />

      {/* Title */}
      <h1 style={{ fontSize: '34px', fontWeight: 700, color: '#1D1D1E', margin: '0 0 4px 0', textAlign: 'center' }}>
        LetterDrop
      </h1>

      {/* HUD */}
      <div style={{ width: '100%', maxWidth: `${canvasWidth}px` }}>
        <HUD />
      </div>

      {/* Navigation Tabs */}
      <div role="tablist" aria-label="Application views" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {[
          { key: 'game' as const, label: 'Game' },
          { key: 'history' as const, label: 'History' },
          { key: 'achievements' as const, label: 'Achievements' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            aria-label={`View ${label}`}
            aria-selected={currentView === key}
            role="tab"
            className={`ld-btn-toggle${currentView === key ? ' ld-btn-toggle-active' : ''}`}
            style={{
              ...toggleBtn,
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: currentView === key ? 700 : 600,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Game View */}
      {currentView === 'game' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div
            aria-label="Game mode"
            style={{
              width: `${canvasWidth}px`,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            {([
              ['solo', 'Solo', 'Standard pace'],
              ['challenge', 'Challenge', 'Faster drops'],
            ] as const).map(([mode, label, description]) => {
              const active = gameMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setGameMode(mode)}
                  disabled={gameStarted && !isGameOver}
                  aria-pressed={active}
                  className={`ld-btn-toggle${active ? ' ld-btn-toggle-active' : ''}`}
                  style={{
                    ...toggleBtn,
                    padding: '8px 12px',
                    fontWeight: active ? 700 : 600,
                    opacity: gameStarted && !isGameOver ? 0.55 : 1,
                  }}
                >
                  <span style={{ display: 'block' }}>{label}</span>
                  <span style={{ display: 'block', fontSize: '11px', marginTop: '2px' }}>
                    {description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Game Board */}
          <div
            style={{
              position: 'relative',
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              borderRadius: '6px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              backgroundColor: '#E6EEF7',
            }}
          >
            <GameCanvas
              width={canvasWidth}
              height={canvasHeight}
              onTileClick={handleTileClick}
            />
            {!gameStarted && !isGameOver && (
              <div
                role="status"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(245,245,247,0.92)',
                  pointerEvents: 'none',
                  textAlign: 'center',
                  padding: '0 16px',
                }}
              >
                <div style={{ fontSize: '17px', color: '#1D1D1E' }}>
                  Press Start game to begin!
                </div>
                <div style={{ fontSize: '14px', color: '#4F4F55' }}>
                  Tap falling tiles to spell words
                </div>
              </div>
            )}
            {isGameOver && <GameOver onRestart={handleRestart} />}
          </div>

          {/* Word Tray */}
          <WordTray shake={shake} />

          {/* Primary Controls */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', padding: '4px 0' }}>
            {!gameStarted && !isGameOver ? (
              <button
                onClick={handleStartGame}
                className="ld-btn-primary"
                style={primaryBtn}
                aria-label="Start game"
              >
                Start game
              </button>
            ) : (
              <>
                <button
                  onClick={handleSubmitWord}
                  disabled={!canSubmit}
                  aria-label="Submit Word"
                  className="ld-btn-primary"
                  style={{ ...primaryBtn, opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
                >
                  Submit Word
                </button>

                <button
                  onClick={undoLastTile}
                  disabled={!canUndo}
                  aria-label="Undo Last Tile"
                  className="ld-btn-secondary"
                  style={{ ...secondaryBtn, opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'not-allowed' }}
                >
                  Undo Last Tile
                </button>

                {gameStarted && !isGameOver && (
                  <button
                    onClick={isPaused ? resumeGame : pauseGame}
                    aria-label={isPaused ? 'Resume' : 'Pause'}
                    className={isPaused ? 'ld-btn-secondary' : 'ld-btn-primary'}
                    style={isPaused ? secondaryBtn : primaryBtn}
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                )}
              </>
            )}
            
            {/* Added Save Progress, Resume Saved Run, and Export Run features */}
            {gameStarted && !isGameOver && (
              <button
                onClick={() => saveCheckpoint()}
                disabled={!canSaveProgress}
                aria-label="Save Progress"
                className="ld-btn-secondary"
                style={{ ...secondaryBtn, opacity: canSaveProgress ? 1 : 0.4, cursor: canSaveProgress ? 'pointer' : 'not-allowed', width: '100%', marginTop: '8px' }}
              >
                Save Progress
              </button>
            )}

            {!gameStarted && !isGameOver && hasCheckpoint && (
              <button
                onClick={() => resumeCheckpoint()}
                aria-label="Resume Saved Run"
                className="ld-btn-secondary"
                style={{ ...secondaryBtn, width: '100%', marginTop: '8px' }}
              >
                Resume Saved Run
              </button>
            )}
          </div>

          {/* Branching scenario history */}
          {gameStarted && !isGameOver && (
            <section
              aria-label="History state"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
                width: `${canvasWidth}px`,
                padding: '12px',
                border: '1px solid #66798B',
                borderRadius: '6px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <button
                onClick={applyScenarioChange}
                disabled={isPaused}
                className="ld-btn-primary"
                style={{
                  ...primaryBtn,
                  width: '100%',
                  opacity: isPaused ? 0.4 : 1,
                  cursor: isPaused ? 'not-allowed' : 'pointer',
                }}
              >
                Apply Scenario Change
              </button>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={undoAction}
                  disabled={!canUndoAction}
                  aria-label="Undo"
                  className="ld-btn-secondary"
                  style={{ ...secondaryBtn, padding: '8px 14px', fontSize: '12px', opacity: canUndoAction ? 1 : 0.4, cursor: canUndoAction ? 'pointer' : 'not-allowed' }}
                >
                  ↩ Undo
                </button>
                <button
                  onClick={redoAction}
                  disabled={!canRedoAction}
                  aria-label="Redo"
                  className="ld-btn-secondary"
                  style={{ ...secondaryBtn, padding: '8px 14px', fontSize: '12px', opacity: canRedoAction ? 1 : 0.4, cursor: canRedoAction ? 'pointer' : 'not-allowed' }}
                >
                  ↪ Redo
                </button>
              </div>
              <div
                style={{ fontSize: '13px', color: '#4F4F55', textAlign: 'center', fontWeight: 600 }}
                aria-live="polite"
              >
                History state: Scenario {scenarioRevision} • {tiles.length} tiles • {currentHistoryNode?.label || 'Run started'}
              </div>
              {branchIds.length > 1 && (
                <div style={{ width: '100%' }}>
                  <div style={{ fontSize: '12px', color: '#4F4F55', marginBottom: '6px', textAlign: 'center' }}>
                    Select a history branch
                  </div>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {branchIds.map((nodeId, index) => {
                      const node = historyNodes.find(candidate => candidate.id === nodeId);
                      if (!node) return null;
                      const active = node.id === currentHistoryNodeId;
                      return (
                        <button
                          key={node.id}
                          onClick={() => selectHistoryNode(node.id)}
                          aria-pressed={active}
                          className={`ld-btn-toggle${active ? ' ld-btn-toggle-active' : ''}`}
                          style={{
                            ...toggleBtn,
                            padding: '8px 12px',
                            fontSize: '12px',
                            fontWeight: active ? 700 : 600,
                          }}
                        >
                          Branch {index + 1}: {node.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* History View */}
      {currentView === 'history' && (
        <div style={{ width: '100%', maxWidth: `${canvasWidth}px`, backgroundColor: '#FFFFFF', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <MatchHistory />
        </div>
      )}

      {/* Achievements View */}
      {currentView === 'achievements' && (
        <div style={{ width: '100%', maxWidth: `${canvasWidth}px`, backgroundColor: '#FFFFFF', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <Achievements />
        </div>
      )}
    </div>
  );
};

export default App;
