import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasObject } from '../types';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  selectOnly,
  toggleSelect,
  updateObject,
  setConnectFrom,
  addConnector,
  setShowDeleteConfirm,
  clearLastAdded,
  moveObject,
  resizeObject,
} from '../slices/appSlice';
import { NOTE_COLORS, SHAPE_COLORS } from '../slices/appSlice';

interface CanvasObjectProps {
  obj: CanvasObject;
  isSelected: boolean;
  isSearchHighlight: boolean;
  isConnectSource: boolean;
  zoom: number;
}

type Corner = 'nw' | 'ne' | 'sw' | 'se';

const CanvasObjectComponent: React.FC<CanvasObjectProps> = ({
  obj,
  isSelected,
  isSearchHighlight,
  isConnectSource,
  zoom,
}) => {
  const dispatch = useAppDispatch();
  const activeTool = useAppSelector(s => s.app.activeTool);
  const connectFromId = useAppSelector(s => s.app.connectFromId);
  const selectedIds = useAppSelector(s => s.app.selectedIds);
  const lastAddedId = useAppSelector(s => s.app.lastAddedId);

  const [isEditing, setIsEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dragGhost, setDragGhost] = useState<{ x: number; y: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const singleSelected = isSelected && selectedIds.length === 1;

  // Focus a freshly created object so keyboard users can continue immediately
  useEffect(() => {
    if (lastAddedId === obj.id) {
      wrapperRef.current?.focus();
      dispatch(clearLastAdded());
    }
  }, [lastAddedId, obj.id, dispatch]);

  const handleConnectPick = useCallback(() => {
    if (connectFromId === null) {
      dispatch(setConnectFrom(obj.id));
    } else if (connectFromId !== obj.id) {
      dispatch(addConnector({ fromId: connectFromId, toId: obj.id }));
    } else {
      dispatch(setConnectFrom(null));
    }
  }, [connectFromId, obj.id, dispatch]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (activeTool === 'connect') {
        e.preventDefault();
        handleConnectPick();
        return;
      }
      const target = e.target as HTMLElement;
      if (target.closest('button, textarea, input')) return;
      if (isEditing) return;
      e.preventDefault();
      wrapperRef.current?.focus();

      if (e.shiftKey) {
        dispatch(toggleSelect(obj.id));
        return;
      }
      if (!selectedIds.includes(obj.id)) {
        dispatch(selectOnly(obj.id));
      }

      // Drag with an abort path: Escape returns the object to its origin
      const startX = e.clientX;
      const startY = e.clientY;
      const origX = obj.x;
      const origY = obj.y;
      let moved = false;

      const onMove = (me: MouseEvent) => {
        const dx = (me.clientX - startX) / zoom;
        const dy = (me.clientY - startY) / zoom;
        if (!moved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
          moved = true;
          setDragGhost({ x: origX, y: origY });
        }
        if (moved) {
          dispatch(updateObject({ id: obj.id, updates: { x: origX + dx, y: origY + dy } }));
        }
      };
      const cleanup = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('keydown', onKey, true);
        setDragGhost(null);
      };
      const onUp = () => cleanup();
      const onKey = (ke: KeyboardEvent) => {
        if (ke.key === 'Escape') {
          dispatch(updateObject({ id: obj.id, updates: { x: origX, y: origY } }));
          cleanup();
        }
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('keydown', onKey, true);
    },
    [activeTool, handleConnectPick, isEditing, obj.id, obj.x, obj.y, selectedIds, zoom, dispatch]
  );

  const startCornerResize = useCallback(
    (e: React.MouseEvent, corner: Corner) => {
      e.stopPropagation();
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const orig = { x: obj.x, y: obj.y, w: obj.width, h: obj.height };

      const onMove = (me: MouseEvent) => {
        const dx = (me.clientX - startX) / zoom;
        const dy = (me.clientY - startY) / zoom;
        let newW = orig.w;
        let newH = orig.h;
        let newX = orig.x;
        let newY = orig.y;
        if (corner === 'se' || corner === 'ne') newW = Math.max(60, orig.w + dx);
        if (corner === 'sw' || corner === 'nw') {
          newW = Math.max(60, orig.w - dx);
          newX = orig.x + (orig.w - newW);
        }
        if (corner === 'se' || corner === 'sw') newH = Math.max(50, orig.h + dy);
        if (corner === 'ne' || corner === 'nw') {
          newH = Math.max(50, orig.h - dy);
          newY = orig.y + (orig.h - newH);
        }
        dispatch(
          updateObject({ id: obj.id, updates: { x: newX, y: newY, width: newW, height: newH } })
        );
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [obj.id, obj.x, obj.y, obj.width, obj.height, zoom, dispatch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (activeTool === 'connect') {
          handleConnectPick();
          return;
        }
        if (!selectedIds.includes(obj.id)) {
          dispatch(selectOnly(obj.id));
        }
        if (e.key === 'Enter' && (obj.type === 'note' || obj.type === 'flashcard')) {
          setIsEditing(true);
        }
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (!selectedIds.includes(obj.id)) {
          dispatch(selectOnly(obj.id));
        }
        dispatch(setShowDeleteConfirm(true));
        return;
      }
      const step = 16;
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        if (e.shiftKey) {
          const dw = e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0;
          const dh = e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0;
          dispatch(resizeObject({ id: obj.id, dw, dh }));
        } else {
          const dx = e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0;
          const dy = e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0;
          dispatch(moveObject({ id: obj.id, dx, dy }));
        }
      }
    },
    [activeTool, handleConnectPick, obj.id, obj.type, selectedIds, dispatch]
  );

  const finishEditing = useCallback(() => {
    setIsEditing(false);
    wrapperRef.current?.focus();
  }, []);

  // Shadow composition keeps drop shadow, hover, selection and search glow stackable
  const shadows: string[] = [];
  if (obj.type === 'note' || obj.type === 'flashcard') {
    shadows.push('0 3px 10px rgba(33, 29, 58, 0.18)');
  } else {
    shadows.push('0 2px 6px rgba(33, 29, 58, 0.15)');
  }
  if (hovered) shadows.push('0 8px 22px rgba(33, 29, 58, 0.25)');
  if (isSelected) shadows.push('0 0 0 3px var(--color-primary)');
  if (isSearchHighlight) {
    shadows.push('0 0 0 4px rgba(109, 91, 208, 0.85), 0 0 20px 7px rgba(109, 91, 208, 0.55)');
  }
  if (isConnectSource) shadows.push('0 0 0 5px rgba(224, 160, 48, 0.85)');

  const accessibleName =
    obj.type === 'note'
      ? `Note: ${obj.text ? obj.text.slice(0, 60) : 'empty'}`
      : obj.type === 'flashcard'
        ? `Flashcard ${obj.flipped ? 'back' : 'front'}: ${
            (obj.flipped ? obj.back : obj.front)?.slice(0, 60) || 'empty'
          }`
        : `${obj.type.charAt(0).toUpperCase()}${obj.type.slice(1)} shape`;

  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    left: obj.x,
    top: obj.y,
    width: obj.width,
    height: obj.height,
    zIndex: obj.zIndex,
    cursor: activeTool === 'connect' ? 'crosshair' : 'move',
    userSelect: isEditing ? 'text' : 'none',
    boxShadow: shadows.join(', '),
    borderRadius: obj.type === 'circle' ? '50%' : '8px',
  };

  const cornerHandles = singleSelected && activeTool === 'select' && (
    <>
      {(['nw', 'ne', 'sw', 'se'] as Corner[]).map(corner => (
        <button
          key={corner}
          type="button"
          tabIndex={-1}
          aria-label={`Resize from ${
            corner === 'nw'
              ? 'top-left'
              : corner === 'ne'
                ? 'top-right'
                : corner === 'sw'
                  ? 'bottom-left'
                  : 'bottom-right'
          } corner`}
          onMouseDown={e => startCornerResize(e, corner)}
          style={{
            position: 'absolute',
            width: 24,
            height: 24,
            top: corner === 'nw' || corner === 'ne' ? -12 : undefined,
            bottom: corner === 'sw' || corner === 'se' ? -12 : undefined,
            left: corner === 'nw' || corner === 'sw' ? -12 : undefined,
            right: corner === 'ne' || corner === 'se' ? -12 : undefined,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'block',
              width: 12,
              height: 12,
              backgroundColor: 'var(--color-primary)',
              border: '2px solid #FFFFFF',
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(33, 29, 58, 0.35)',
            }}
          />
        </button>
      ))}
    </>
  );

  const colorSwatches = (palette: { hex: string; name: string }[]) => (
    <div
      className="flex flex-wrap gap-1"
      role="group"
      aria-label="Color picker"
      onMouseDown={e => e.stopPropagation()}
    >
      {palette.map(c => (
        <button
          key={c.hex}
          type="button"
          aria-label={`Set color to ${c.name}`}
          aria-pressed={obj.color === c.hex}
          title={`Set color to ${c.name}`}
          onClick={e => {
            e.stopPropagation();
            dispatch(updateObject({ id: obj.id, updates: { color: c.hex } }));
          }}
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: c.hex,
            border: '1.5px solid var(--color-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          {obj.color === c.hex && (
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6.5 L5 9 L10 3" stroke="#211D3A" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );

  const ghost = dragGhost && (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: dragGhost.x,
        top: dragGhost.y,
        width: obj.width,
        height: obj.height,
        border: '2px dashed var(--color-text-secondary)',
        borderRadius: obj.type === 'circle' ? '50%' : '8px',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );

  const commonProps = {
    ref: wrapperRef,
    role: 'group' as const,
    'aria-label': accessibleName,
    tabIndex: 0,
    className: 'canvas-object-wrapper',
    onMouseDown: handleMouseDown,
    onKeyDown: handleKeyDown,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onDoubleClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      if (activeTool === 'select' && (obj.type === 'note' || obj.type === 'flashcard')) {
        if (!selectedIds.includes(obj.id)) dispatch(selectOnly(obj.id));
        setIsEditing(true);
      }
    },
    'data-canvas-object': true,
  };

  // === NOTE ===
  if (obj.type === 'note') {
    const labelId = `note-label-${obj.id}`;
    return (
      <>
        {ghost}
        <div {...commonProps} style={{ ...wrapperStyle, backgroundColor: obj.color, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="flex items-center justify-between gap-1" style={{ minHeight: 16 }}>
            <span
              id={labelId}
              className="font-semibold"
              style={{ fontSize: '11px', letterSpacing: '0.03em', color: 'var(--color-text-secondary)' }}
            >
              Note
            </span>
          </div>
          {singleSelected && colorSwatches(NOTE_COLORS)}
          <div className="flex-1 min-h-0">
            {isEditing ? (
              <textarea
                aria-labelledby={labelId}
                className="w-full h-full bg-transparent resize-none"
                style={{
                  fontSize: '16px',
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                  color: 'var(--color-text-primary)',
                  border: 'none',
                  outline: '2px solid var(--color-primary)',
                  outlineOffset: '2px',
                  borderRadius: 4,
                }}
                value={obj.text || ''}
                onChange={e => dispatch(updateObject({ id: obj.id, updates: { text: e.target.value } }))}
                onBlur={() => setIsEditing(false)}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    finishEditing();
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    finishEditing();
                  }
                }}
                autoFocus
                onMouseDown={e => e.stopPropagation()}
              />
            ) : (
              <div
                className="w-full h-full overflow-hidden whitespace-pre-wrap break-words"
                style={{ fontSize: '16px', lineHeight: 1.5, color: 'var(--color-text-primary)' }}
              >
                {obj.text || (
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    Double-click or press Enter to add text
                  </span>
                )}
              </div>
            )}
          </div>
          {cornerHandles}
        </div>
      </>
    );
  }

  // === FLASHCARD ===
  if (obj.type === 'flashcard') {
    const sideLabelId = `card-side-${obj.id}`;
    const showingBack = !!obj.flipped;
    const sideValue = showingBack ? obj.back : obj.front;
    return (
      <>
        {ghost}
        <div
          {...commonProps}
          style={{
            ...wrapperStyle,
            backgroundColor: '#FFFFFF',
            border: '1.5px solid var(--color-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible',
          }}
        >
          <div
            className="flex items-center justify-between gap-1 px-2.5 py-1.5"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <span className="flex items-center gap-1.5">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M11.5 5.5 A5 5 0 0 0 3 3.5 M2.5 8.5 A5 5 0 0 0 11 10.5"
                  stroke="var(--color-primary)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path d="M3 1 L3 4 L6 4" stroke="var(--color-primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M11 13 L11 10 L8 10" stroke="var(--color-primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span
                id={sideLabelId}
                className="font-semibold"
                style={{ fontSize: '11px', letterSpacing: '0.03em', color: 'var(--color-text-secondary)' }}
              >
                {showingBack ? 'Back' : 'Front'}
              </span>
            </span>
            <button
              type="button"
              className="font-semibold hover:bg-[#EAE6F7]"
              style={{
                fontSize: '12px',
                color: 'var(--color-primary)',
                backgroundColor: '#F3F0FF',
                border: '1px solid var(--color-primary)',
                borderRadius: 6,
                padding: '4px 10px',
                minHeight: 26,
                cursor: 'pointer',
              }}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => {
                e.stopPropagation();
                dispatch(updateObject({ id: obj.id, updates: { flipped: !obj.flipped } }));
              }}
            >
              Flip
            </button>
          </div>
          {singleSelected && (
            <div className="px-2.5 pt-1.5" onMouseDown={e => e.stopPropagation()} />
          )}
          <div className="flex-1 px-2.5 py-2 min-h-0">
            {isEditing ? (
              <textarea
                aria-labelledby={sideLabelId}
                className="w-full h-full bg-transparent resize-none"
                style={{
                  fontSize: '16px',
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                  color: 'var(--color-text-primary)',
                  border: 'none',
                  outline: '2px solid var(--color-primary)',
                  outlineOffset: '2px',
                  borderRadius: 4,
                }}
                value={sideValue || ''}
                onChange={e =>
                  dispatch(
                    updateObject({
                      id: obj.id,
                      updates: showingBack ? { back: e.target.value } : { front: e.target.value },
                    })
                  )
                }
                onBlur={() => setIsEditing(false)}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    finishEditing();
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    finishEditing();
                  }
                }}
                autoFocus
                onMouseDown={e => e.stopPropagation()}
              />
            ) : (
              <div
                className="w-full h-full overflow-hidden whitespace-pre-wrap break-words"
                style={{ fontSize: '16px', lineHeight: 1.5, color: 'var(--color-text-primary)' }}
              >
                {sideValue || (
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    Double-click or press Enter to add {showingBack ? 'back' : 'front'} text
                  </span>
                )}
              </div>
            )}
          </div>
          {cornerHandles}
        </div>
      </>
    );
  }

  // === SHAPES ===
  const shapeSwatches = singleSelected && (
    <div
      style={{ position: 'absolute', top: -40, left: 0, zIndex: 6 }}
      className="bg-white/95 px-2 py-1 shadow-md"
    >
      {colorSwatches(SHAPE_COLORS)}
    </div>
  );

  if (obj.type === 'rectangle' || obj.type === 'circle') {
    return (
      <>
        {ghost}
        <div
          {...commonProps}
          style={{
            ...wrapperStyle,
            backgroundColor: obj.color,
            borderRadius: obj.type === 'circle' ? '50%' : '8px',
          }}
        >
          {shapeSwatches}
          {cornerHandles}
        </div>
      </>
    );
  }

  // arrow
  return (
    <>
      {ghost}
      <div {...commonProps} style={{ ...wrapperStyle, backgroundColor: 'transparent', boxShadow: shadows.slice(1).join(', ') || undefined }}>
        <svg width="100%" height="100%" viewBox="0 0 120 80" preserveAspectRatio="none" aria-hidden="true">
          <line x1="10" y1="40" x2="88" y2="40" stroke={obj.color} strokeWidth="8" strokeLinecap="round" />
          <polygon points="86,24 114,40 86,56" fill={obj.color} />
        </svg>
        {shapeSwatches}
        {cornerHandles}
      </div>
    </>
  );
};

export default CanvasObjectComponent;
