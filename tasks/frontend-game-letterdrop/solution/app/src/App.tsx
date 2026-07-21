import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import GameCanvas from './components/GameCanvas';
import WordTray from './components/WordTray';
import HUD from './components/HUD';
import Toast from './components/Toast';
import GameOver from './components/GameOver';
import MatchHistory from './components/MatchHistory';
import Achievements from './components/Achievements';
import SettingsDialog from './components/SettingsDialog';
import ExportDialog from './components/ExportDialog';
const CANVAS_WIDTH = 340;
const CANVAS_HEIGHT = 480;
const INK = '#0052A3';

const App: React.FC = () => {
  const [shake, setShake] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(CANVAS_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(CANVAS_HEIGHT);
  const containerRef = useRef<HTMLDivElement>(null);

  const gameStarted = useGameStore((s) => s.gameStarted);
  const isPaused = useGameStore((s) => s.isPaused);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const currentView = useGameStore((s) => s.currentView);
  const selectedWord = useGameStore((s) => s.selectedWord);
  const gameMode = useGameStore((s) => s.gameMode);
  const historyNodes = useGameStore((s) => s.historyNodes);
  const currentHistoryNodeId = useGameStore((s) => s.currentHistoryNodeId);
  const scenarioRevision = useGameStore((s) => s.scenarioRevision);
  const checkpoint = useGameStore((s) => s.checkpoint);
  const playerName = useGameStore((s) => s.playerName);
  const score = useGameStore((s) => s.score);
  const tilesCleared = useGameStore((s) => s.tilesCleared);
  const tileCount = useGameStore((s) => s.tiles.length);

  const startGame = useGameStore((s) => s.startGame);
  const restartGame = useGameStore((s) => s.restartGame);
  const setGameMode = useGameStore((s) => s.setGameMode);
  const pauseGame = useGameStore((s) => s.pauseGame);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const spawnTile = useGameStore((s) => s.spawnTile);
  const updateTiles = useGameStore((s) => s.updateTiles);
  const selectTile = useGameStore((s) => s.selectTile);
  const deselectTile = useGameStore((s) => s.deselectTile);
  const submitWord = useGameStore((s) => s.submitWord);
  const undoLastTile = useGameStore((s) => s.undoLastTile);
  const setView = useGameStore((s) => s.setView);
  const checkAchievements = useGameStore((s) => s.checkAchievements);
  const openSettings = useGameStore((s) => s.openSettings);
  const saveCheckpoint = useGameStore((s) => s.saveCheckpoint);
  const resumeCheckpoint = useGameStore((s) => s.resumeCheckpoint);
  const undoAction = useGameStore((s) => s.undoAction);
  const redoAction = useGameStore((s) => s.redoAction);
  const applyScenarioChange = useGameStore((s) => s.applyScenarioChange);
  const selectHistoryNode = useGameStore((s) => s.selectHistoryNode);

  // Responsive sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const w = Math.min(containerRef.current.offsetWidth - 24, CANVAS_WIDTH);
        const cw = Math.max(w, 220);
        setCanvasWidth(cw);
        setCanvasHeight(Math.round((cw * CANVAS_HEIGHT) / CANVAS_WIDTH));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const lastFrameTime = useRef<number>(0);
  const spawnAccumulator = useRef<number>(0);
  const gameLoopRef = useRef<number>(0);
  const canvasWidthRef = useRef(CANVAS_WIDTH);
  useEffect(() => {
    canvasWidthRef.current = canvasWidth;
  }, [canvasWidth]);

  // Game loop. The spawn interval is divided by the eased spawnFlow scale so
  // the spawn rate ramps gradually alongside the fall speed.
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
      const st = useGameStore.getState();
      if (!st.isPaused) {
        const spawnFlow = st.spawnFlow || 1;
        const interval = Math.max(120, 2200 / spawnFlow);
        spawnAccumulator.current += dt * 1000;
        let guard = 0;
        while (spawnAccumulator.current >= interval && guard < 8) {
          spawnAccumulator.current -= interval;
          spawnTile(canvasWidthRef.current);
          guard++;
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

  // Periodic achievement check (time-based milestones like Marathon).
  useEffect(() => {
    if (!gameStarted || isPaused || isGameOver) return;
    const interval = setInterval(() => checkAchievements(), 5000);
    return () => clearInterval(interval);
  }, [gameStarted, isPaused, isGameOver, checkAchievements]);

  const handleTileClick = useCallback(
    (tileId: string) => {
      const tile = useGameStore.getState().tiles.find((t) => t.id === tileId);
      if (tile?.selected) deselectTile(tileId);
      else selectTile(tileId);
    },
    [selectTile, deselectTile],
  );

  const handleSubmitWord = useCallback(() => {
    const selectedCount = useGameStore.getState().selectedWord.length;
    const result = submitWord();
    if (!result && selectedCount >= 2) {
      setShake(true);
      window.setTimeout(() => setShake(false), 600);
    }
  }, [submitWord]);

  const handleStartGame = useCallback(() => {
    startGame();
    lastFrameTime.current = 0;
    spawnAccumulator.current = 0;
  }, [startGame]);

  const handleRestart = useCallback(() => {
    restartGame();
    lastFrameTime.current = 0;
    spawnAccumulator.current = 0;
  }, [restartGame]);

  // Keyboard shortcuts (only when a control isn't already owning the key).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const st = useGameStore.getState();
      if (e.key === 'Escape') {
        // Native dialogs own Escape. Their close handlers synchronize the
        // store; the same key must not also resume the paused run underneath.
        if (st.settingsOpen || st.exportPreview) return;
        if (st.isPaused) {
          e.preventDefault();
          resumeGame();
        }
        return;
      }
      const target = e.target;
      if (target instanceof HTMLElement && (target.tagName === 'BUTTON' || target.tagName === 'CANVAS' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (!st.gameStarted || st.isGameOver || st.isPaused) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmitWord();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        undoLastTile();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        pauseGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmitWord, undoLastTile, pauseGame, resumeGame]);

  const primaryBtn: React.CSSProperties = {
    color: '#FEFEFE',
    border: 'none',
    borderRadius: '1000px',
    padding: '11px 22px',
    fontSize: '17px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.15s, box-shadow 0.15s',
    outline: 'none',
    minHeight: '48px',
  };
  const secondaryBtn: React.CSSProperties = {
    color: INK,
    border: 'none',
    borderRadius: '1000px',
    padding: '11px 18px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s, box-shadow 0.15s',
    outline: 'none',
    minHeight: '48px',
  };
  const toggleBtn: React.CSSProperties = {
    border: 'none',
    borderRadius: '1000px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s, box-shadow 0.15s',
    outline: 'none',
    minHeight: '44px',
    padding: '10px 18px',
  };

  const canSubmit = gameStarted && !isPaused && selectedWord.length >= 2;
  const canUndo = gameStarted && !isPaused && selectedWord.length > 0;
  const canSaveProgress = gameStarted && !isGameOver && (score > 0 || tilesCleared > 0);
  const showResume = !gameStarted && !isGameOver && checkpoint !== null;

  const currentHistoryNode = historyNodes.find((n) => n.id === currentHistoryNodeId);
  const parentHistoryNode = currentHistoryNode?.parentId
    ? historyNodes.find((n) => n.id === currentHistoryNode.parentId)
    : undefined;
  const branchIds = parentHistoryNode?.children.length
    ? parentHistoryNode.children
    : currentHistoryNode?.children || [];
  const canUndoAction = Boolean(currentHistoryNode?.parentId);
  const canRedoAction = Boolean((currentHistoryNode?.children || []).length);

  const tabs: { key: 'game' | 'history' | 'achievements'; label: string }[] = [
    { key: 'game', label: 'Game' },
    { key: 'history', label: 'History' },
    { key: 'achievements', label: 'Achievements' },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 12px 40px',
        maxWidth: '480px',
        margin: '0 auto',
        fontFamily: 'Arial, -apple-system, BlinkMacSystemFont, "Apple Color Emoji", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      <Toast />
      <SettingsDialog />
      <ExportDialog />

      {/* Header: title + player/settings control */}
      <div style={{ width: '100%', maxWidth: `${canvasWidth}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#1D1D1E', margin: '2px 0', letterSpacing: '-0.5px' }}>
          LetterDrop
        </h1>
        <button
          onClick={openSettings}
          className="ld-btn-secondary"
          aria-label={`Open player settings (player ${playerName})`}
          style={{ ...secondaryBtn, padding: '9px 14px', fontSize: '13px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span aria-hidden="true" style={{ fontSize: '15px', lineHeight: 1 }}>⚙</span>
          {playerName}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: `${canvasWidth}px` }}>
        <HUD />
      </div>

      {/* View tabs */}
      <div role="tablist" aria-label="Application views" style={{ display: 'flex', gap: '8px', marginBottom: '12px', width: '100%', maxWidth: `${canvasWidth}px` }}>
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            aria-label={`View ${label}`}
            aria-selected={currentView === key}
            role="tab"
            className={`ld-btn-toggle${currentView === key ? ' ld-btn-toggle-active' : ''}`}
            style={{ ...toggleBtn, flex: 1, fontWeight: currentView === key ? 700 : 600 }}
          >
            {label}
          </button>
        ))}
      </div>

      {currentView === 'game' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {/* Mode toggle */}
          <div aria-label="Game mode" style={{ width: `${canvasWidth}px`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {([
              ['solo', 'Solo', 'Standard pace'],
              ['challenge', 'Challenge', 'Faster drops'],
            ] as const).map(([mode, label, description]) => {
              const active = gameMode === mode;
              const locked = gameStarted && !isGameOver;
              return (
                <button
                  key={mode}
                  onClick={() => setGameMode(mode)}
                  disabled={locked}
                  aria-pressed={active}
                  className={`ld-btn-toggle${active ? ' ld-btn-toggle-active' : ''}`}
                  style={{ ...toggleBtn, padding: '8px 12px', fontWeight: active ? 700 : 600, opacity: locked ? 0.55 : 1 }}
                >
                  <span style={{ display: 'block' }}>{label}</span>
                  <span style={{ display: 'block', fontSize: '11px', marginTop: '2px' }}>{description}</span>
                </button>
              );
            })}
          </div>

          {/* Board */}
          <div
            style={{
              position: 'relative',
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
              backgroundColor: '#E6EEF7',
            }}
          >
            <GameCanvas width={canvasWidth} height={canvasHeight} onTileClick={handleTileClick} />

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
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#1D1D1E' }}>Press "Start game" to begin!</div>
                <div style={{ fontSize: '14px', color: '#4F4F55' }}>Tap falling tiles to spell words</div>
              </div>
            )}

            {gameStarted && isPaused && !isGameOver && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(15,23,34,0.55)',
                  pointerEvents: 'none',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '1px' }}>Paused</div>
                <div style={{ fontSize: '14px', color: '#E6EEF7', fontWeight: 600 }}>Press Resume to continue</div>
              </div>
            )}

            {isGameOver && <GameOver onRestart={handleRestart} />}
          </div>

          <WordTray shake={shake} />

          {/* Primary controls */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', width: `${canvasWidth}px` }}>
            {!gameStarted && !isGameOver ? (
              <button onClick={handleStartGame} className="ld-btn-primary" style={{ ...primaryBtn, flex: '1 1 100%' }} aria-label="Start game">
                Start game
              </button>
            ) : (
              <>
                <button
                  onClick={handleSubmitWord}
                  disabled={!canSubmit}
                  aria-label="Submit Word"
                  className="ld-btn-primary"
                  style={{ ...primaryBtn, opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? 'pointer' : 'not-allowed', flex: '1 1 46%' }}
                >
                  Submit Word
                </button>
                <button
                  onClick={undoLastTile}
                  disabled={!canUndo}
                  aria-label="Undo Last Tile"
                  className="ld-btn-secondary"
                  style={{ ...secondaryBtn, opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'not-allowed', flex: '1 1 46%' }}
                >
                  Undo Last Tile
                </button>
                {gameStarted && !isGameOver && (
                  <button
                    onClick={isPaused ? resumeGame : pauseGame}
                    aria-label={isPaused ? 'Resume' : 'Pause'}
                    className={isPaused ? 'ld-btn-secondary' : 'ld-btn-primary'}
                    style={isPaused ? { ...secondaryBtn, flex: '1 1 100%' } : { ...primaryBtn, flex: '1 1 100%' }}
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                )}
              </>
            )}

            {gameStarted && !isGameOver && (
              <button
                onClick={() => saveCheckpoint()}
                disabled={!canSaveProgress}
                aria-label="Save Progress"
                className="ld-btn-secondary"
                style={{ ...secondaryBtn, opacity: canSaveProgress ? 1 : 0.4, cursor: canSaveProgress ? 'pointer' : 'not-allowed', flex: '1 1 100%', marginTop: '4px' }}
              >
                Save Progress
              </button>
            )}

            {showResume && (
              <button
                onClick={() => resumeCheckpoint(canvasWidth)}
                aria-label="Resume Saved Run"
                className="ld-btn-secondary"
                style={{ ...secondaryBtn, flex: '1 1 100%', marginTop: '4px' }}
              >
                Resume Saved Run
              </button>
            )}
          </div>

          {/* Saved-checkpoint summary surface — uses the exact checkpoint field
              names so the resume confirmation matches the saved payload. */}
          {showResume && checkpoint && (
            <section
              aria-label="Saved checkpoint"
              style={{
                width: `${canvasWidth}px`,
                marginTop: '10px',
                padding: '12px 14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D8DEE6',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: '#4F4F55',
              }}
            >
              <div style={{ fontWeight: 700, color: '#1D1D1E', marginBottom: '6px', fontSize: '13px' }}>Saved checkpoint (letterdrop-checkpoint-v1)</div>
              <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '2px 10px', margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
                <dt>format</dt><dd style={{ margin: 0 }}>{checkpoint.format}</dd>
                <dt>schemaVersion</dt><dd style={{ margin: 0 }}>{checkpoint.schemaVersion}</dd>
                <dt>score</dt><dd style={{ margin: 0 }}>{checkpoint.score}</dd>
                <dt>streak</dt><dd style={{ margin: 0 }}>{checkpoint.streak}</dd>
                <dt>tier</dt><dd style={{ margin: 0 }}>{checkpoint.tier}</dd>
                <dt>trayLetters</dt><dd style={{ margin: 0 }}>{checkpoint.trayLetters || '—'}</dd>
                <dt>tiles</dt><dd style={{ margin: 0 }}>{checkpoint.tiles.length} tile(s)</dd>
                <dt>durationSec</dt><dd style={{ margin: 0 }}>{checkpoint.durationSec}</dd>
                <dt>playerName</dt><dd style={{ margin: 0 }}>{checkpoint.playerName}</dd>
                <dt>startingTier</dt><dd style={{ margin: 0 }}>{checkpoint.startingTier}</dd>
              </dl>
            </section>
          )}

          {/* Branching scenario history (required advanced feature) */}
          {gameStarted && !isGameOver && (
            <section
              aria-label="History state"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px',
                width: `${canvasWidth}px`,
                padding: '12px',
                border: '1px solid #D8DEE6',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <button
                onClick={applyScenarioChange}
                disabled={isPaused}
                className="ld-btn-primary"
                style={{ ...primaryBtn, width: '100%', opacity: isPaused ? 0.4 : 1, cursor: isPaused ? 'not-allowed' : 'pointer', fontSize: '15px' }}
              >
                Apply Scenario Change
              </button>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={undoAction} disabled={!canUndoAction} aria-label="Undo" className="ld-btn-secondary" style={{ ...secondaryBtn, padding: '8px 14px', fontSize: '13px', opacity: canUndoAction ? 1 : 0.4, cursor: canUndoAction ? 'pointer' : 'not-allowed', minHeight: '40px' }}>
                  ↩ Undo
                </button>
                <button onClick={redoAction} disabled={!canRedoAction} aria-label="Redo" className="ld-btn-secondary" style={{ ...secondaryBtn, padding: '8px 14px', fontSize: '13px', opacity: canRedoAction ? 1 : 0.4, cursor: canRedoAction ? 'pointer' : 'not-allowed', minHeight: '40px' }}>
                  ↪ Redo
                </button>
              </div>
              <div style={{ fontSize: '13px', color: '#4F4F55', textAlign: 'center', fontWeight: 600 }} aria-live="polite">
                History state: Scenario {scenarioRevision} • {tileCount} tiles • {currentHistoryNode?.label || 'Run started'}
              </div>
              {branchIds.length > 1 && (
                <div style={{ width: '100%' }}>
                  <div style={{ fontSize: '12px', color: '#4F4F55', marginBottom: '6px', textAlign: 'center' }}>Select a history branch</div>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {branchIds.map((nodeId, index) => {
                      const node = historyNodes.find((c) => c.id === nodeId);
                      if (!node) return null;
                      const activeBranch = node.id === currentHistoryNodeId;
                      return (
                        <button
                          key={node.id}
                          onClick={() => selectHistoryNode(node.id)}
                          aria-pressed={activeBranch}
                          className={`ld-btn-toggle${activeBranch ? ' ld-btn-toggle-active' : ''}`}
                          style={{ ...toggleBtn, padding: '8px 12px', fontSize: '12px', fontWeight: activeBranch ? 700 : 600 }}
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

      {currentView === 'history' && (
        <div style={{ width: '100%', maxWidth: `${canvasWidth}px`, backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <MatchHistory />
        </div>
      )}

      {currentView === 'achievements' && (
        <div style={{ width: '100%', maxWidth: `${canvasWidth}px`, backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <Achievements />
        </div>
      )}
    </div>
  );
};

export default App;
