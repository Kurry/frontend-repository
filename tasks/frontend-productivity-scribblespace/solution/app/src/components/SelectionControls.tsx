import React from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  bringToFront,
  sendToBack,
  deselectAll,
  moveObject,
  resizeObject,
  setShowDeleteConfirm,
  deleteSelectedObjects,
} from '../slices/appSlice';
import ConfirmDialog from './ConfirmDialog';

const NUDGE = 24;

const iconBtnStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '8px',
  border: '1.5px solid var(--color-text-secondary)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  fontSize: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const SelectionControls: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector(s => s.app.selectedIds);
  const showDeleteConfirm = useAppSelector(s => s.app.showDeleteConfirm);

  if (selectedIds.length === 0) return null;

  const single = selectedIds.length === 1 ? selectedIds[0] : null;
  const count = selectedIds.length;

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-3 py-2 bg-white/95 shadow-md w-full"
      style={{ borderRadius: '12px', border: '1px solid var(--color-border)' }}
      role="toolbar"
      aria-label="Selection actions"
    >
      <span
        className="font-semibold whitespace-nowrap px-2"
        style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}
      >
        {count === 1 ? '1 selected' : `${count} selected`}
      </span>
      <button type="button" className="btn-warning" onClick={() => dispatch(setShowDeleteConfirm(true))}>
        Delete Selected
      </button>
      <button type="button" className="btn-secondary" onClick={() => dispatch(deselectAll())}>
        Clear selection
      </button>

      {single && (
        <>
          <div aria-hidden="true" className="w-px h-8 self-center" style={{ backgroundColor: 'var(--color-border)' }} />
          <button type="button" className="btn-secondary" onClick={() => dispatch(bringToFront(single))}>
            Bring to Front
          </button>
          <button type="button" className="btn-secondary" onClick={() => dispatch(sendToBack(single))}>
            Send to Back
          </button>
          <div className="flex items-center gap-1" role="group" aria-label="Move the selected object">
            <button
              type="button"
              aria-label="Move left"
              title="Move left"
              style={iconBtnStyle}
              className="hover:bg-[#EAE6F7]"
              onClick={() => dispatch(moveObject({ id: single, dx: -NUDGE, dy: 0 }))}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              aria-label="Move up"
              title="Move up"
              style={iconBtnStyle}
              className="hover:bg-[#EAE6F7]"
              onClick={() => dispatch(moveObject({ id: single, dx: 0, dy: -NUDGE }))}
            >
              <span aria-hidden="true">↑</span>
            </button>
            <button
              type="button"
              aria-label="Move down"
              title="Move down"
              style={iconBtnStyle}
              className="hover:bg-[#EAE6F7]"
              onClick={() => dispatch(moveObject({ id: single, dx: 0, dy: NUDGE }))}
            >
              <span aria-hidden="true">↓</span>
            </button>
            <button
              type="button"
              aria-label="Move right"
              title="Move right"
              style={iconBtnStyle}
              className="hover:bg-[#EAE6F7]"
              onClick={() => dispatch(moveObject({ id: single, dx: NUDGE, dy: 0 }))}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="flex items-center gap-1" role="group" aria-label="Resize the selected object">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => dispatch(resizeObject({ id: single, dw: 24, dh: 24 }))}
            >
              Grow
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => dispatch(resizeObject({ id: single, dw: -24, dh: -24 }))}
            >
              Shrink
            </button>
          </div>
        </>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title={count === 1 ? 'Delete 1 object?' : `Delete ${count} objects?`}
          body="This deletes the selected objects and removes any connectors attached to them."
          confirmLabel="Delete"
          onConfirm={() => dispatch(deleteSelectedObjects())}
          onCancel={() => dispatch(setShowDeleteConfirm(false))}
        />
      )}
    </div>
  );
};

export default SelectionControls;
