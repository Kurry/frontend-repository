import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  setTool,
  setZoom,
  resetView,
  setShowExport,
  addObject,
  selectAll,
  setViewMode,
  setShowLivePanel,
} from '../slices/appSlice';

interface ToolbarProps {
  canvasCenter: { x: number; y: number };
}

const Toolbar: React.FC<ToolbarProps> = ({ canvasCenter }) => {
  const dispatch = useAppDispatch();
  const activeTool = useAppSelector(s => s.app.activeTool);
  const zoom = useAppSelector(s => s.app.canvasView.zoom);
  const viewMode = useAppSelector(s => s.app.viewMode);
  const showLivePanel = useAppSelector(s => s.app.showLivePanel);
  const boards = useAppSelector(s => s.app.boards);
  const activeBoardId = useAppSelector(s => s.app.activeBoardId);
  const objectCount = boards.find(b => b.id === activeBoardId)?.objects.length || 0;

  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);
  const shapeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showShapeMenu) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!shapeMenuRef.current?.contains(e.target as Node)) {
        setShowShapeMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [showShapeMenu]);

  const placeAt = () => ({ x: canvasCenter.x - 100, y: canvasCenter.y - 75 });

  const handleAddShape = (kind: 'rectangle' | 'circle' | 'arrow') => {
    const pos = placeAt();
    dispatch(addObject({ kind, x: pos.x, y: pos.y }));
    setShowShapeMenu(false);
    shapeButtonRef.current?.focus();
  };

  const divider = <div aria-hidden="true" className="w-px h-8 self-center" style={{ backgroundColor: 'var(--color-border)' }} />;

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-3 py-2 bg-white/95 shadow-md w-full"
      style={{ borderRadius: '12px', border: '1px solid var(--color-border)' }}
      role="toolbar"
      aria-label="Canvas tools"
    >
      <button
        type="button"
        className="btn-tool"
        aria-pressed={activeTool === 'select'}
        onClick={() => dispatch(setTool('select'))}
      >
        Select
      </button>
      <button
        type="button"
        className="btn-tool"
        aria-pressed={activeTool === 'connect'}
        onClick={() => dispatch(setTool(activeTool === 'connect' ? 'select' : 'connect'))}
      >
        Connect
      </button>

      {divider}

      <button type="button" className="btn-primary" onClick={() => {
        const pos = placeAt();
        dispatch(addObject({ kind: 'note', x: pos.x, y: pos.y }));
      }}>
        New Note
      </button>
      <button type="button" className="btn-primary" onClick={() => {
        const pos = placeAt();
        dispatch(addObject({ kind: 'flashcard', x: pos.x, y: pos.y }));
      }}>
        New Flashcard
      </button>
      <div className="relative" ref={shapeMenuRef}>
        <button
          ref={shapeButtonRef}
          type="button"
          className="btn-primary"
          aria-haspopup="menu"
          aria-expanded={showShapeMenu}
          onClick={() => setShowShapeMenu(v => !v)}
          onKeyDown={e => {
            if (e.key === 'Escape' && showShapeMenu) {
              setShowShapeMenu(false);
            }
          }}
        >
          New Shape
        </button>
        {showShapeMenu && (
          <div
            role="menu"
            aria-label="Shape options"
            className="absolute top-full left-0 mt-1 bg-white shadow-lg py-1 z-50 min-w-[150px]"
            style={{ borderRadius: '8px', border: '1.5px solid var(--color-text-secondary)' }}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                setShowShapeMenu(false);
                shapeButtonRef.current?.focus();
              }
            }}
          >
            {(['rectangle', 'circle', 'arrow'] as const).map(kind => (
              <button
                key={kind}
                type="button"
                role="menuitem"
                className="w-full px-4 text-left hover:bg-[#EAE6F7]"
                style={{ fontSize: '14px', minHeight: '44px', color: 'var(--color-text-primary)' }}
                onClick={() => handleAddShape(kind)}
              >
                {kind === 'rectangle' ? 'Rectangle' : kind === 'circle' ? 'Circle' : 'Arrow'}
              </button>
            ))}
          </div>
        )}
      </div>

      {divider}

      <button
        type="button"
        className="btn-secondary"
        onClick={() => dispatch(selectAll())}
        disabled={objectCount === 0}
      >
        Select all
      </button>
      <button type="button" className="btn-secondary" onClick={() => dispatch(setShowExport(true))}>
        Export as Text
      </button>

      {divider}

      <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Zoom controls">
        <button type="button" className="btn-secondary" onClick={() => dispatch(setZoom(zoom - 0.15))}>
          Zoom Out
        </button>
        <span
          className="font-semibold text-center"
          style={{ fontSize: '13px', color: 'var(--color-text-secondary)', minWidth: '48px' }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <button type="button" className="btn-secondary" onClick={() => dispatch(setZoom(zoom + 0.15))}>
          Zoom In
        </button>
        <button type="button" className="btn-secondary" onClick={() => dispatch(resetView())}>
          Reset View
        </button>
      </div>

      {divider}

      <button
        type="button"
        className="btn-tool"
        aria-pressed={viewMode === 'outline'}
        onClick={() => dispatch(setViewMode(viewMode === 'outline' ? 'canvas' : 'outline'))}
      >
        {viewMode === 'outline' ? 'Show canvas' : 'Show outline'}
      </button>
      <button
        type="button"
        className="btn-tool"
        aria-pressed={showLivePanel}
        onClick={() => dispatch(setShowLivePanel(!showLivePanel))}
      >
        {showLivePanel ? 'Hide live events' : 'Show live events'}
      </button>
    </div>
  );
};

export default Toolbar;
