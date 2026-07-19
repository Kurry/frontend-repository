import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  updateObject,
  selectOnly,
  setShowDeleteConfirm,
} from '../slices/appSlice';
import { NOTE_COLORS, SHAPE_COLORS } from '../slices/appSlice';

const colorName = (hex: string): string => {
  const named = [...NOTE_COLORS, ...SHAPE_COLORS].find(
    c => c.hex.toLowerCase() === hex.toLowerCase()
  );
  return named ? named.name : 'custom';
};

const OutlineView: React.FC = () => {
  const dispatch = useAppDispatch();
  const boards = useAppSelector(s => s.app.boards);
  const activeBoardId = useAppSelector(s => s.app.activeBoardId);
  const selectedIds = useAppSelector(s => s.app.selectedIds);
  const [editingId, setEditingId] = useState<string | null>(null);

  const board = boards.find(b => b.id === activeBoardId);
  const objects = board?.objects || [];

  if (objects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-4" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center px-8 py-6" style={{ backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '12px', maxWidth: 420 }}>
          <p className="font-semibold" style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>
            This board is empty
          </p>
          <p className="mt-1" style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
            Add a note, flashcard or shape to see it listed here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="mx-auto" style={{ maxWidth: 720 }}>
        <h2 className="font-semibold mb-3" style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>
          Outline of {board?.name}
        </h2>
        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          {objects.map(obj => {
            const isSelected = selectedIds.includes(obj.id);
            const isEditing = editingId === obj.id;
            const typeLabel =
              obj.type === 'note'
                ? 'Note'
                : obj.type === 'flashcard'
                  ? 'Flashcard'
                  : `Shape — ${obj.type}`;
            return (
              <li
                key={obj.id}
                className="bg-white p-3 shadow-sm"
                style={{
                  borderRadius: '8px',
                  border: isSelected
                    ? '2px solid var(--color-primary)'
                    : '1px solid var(--color-border)',
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="font-semibold whitespace-nowrap"
                    style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}
                  >
                    {typeLabel}
                  </span>
                  {obj.type !== 'flashcard' && (
                    <span className="flex items-center gap-1" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      <span
                        aria-hidden="true"
                        style={{
                          display: 'inline-block',
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: obj.color,
                          border: '1px solid var(--color-text-secondary)',
                        }}
                      />
                      {colorName(obj.color)}
                    </span>
                  )}
                  {obj.type === 'flashcard' && (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Showing the {obj.flipped ? 'back' : 'front'}
                    </span>
                  )}
                  <span className="ml-auto flex gap-2">
                    {obj.type === 'flashcard' && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ minHeight: '36px', fontSize: '13px' }}
                        onClick={() =>
                          dispatch(updateObject({ id: obj.id, updates: { flipped: !obj.flipped } }))
                        }
                      >
                        Flip
                      </button>
                    )}
                    {(obj.type === 'note' || obj.type === 'flashcard') && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ minHeight: '36px', fontSize: '13px' }}
                        onClick={() => setEditingId(isEditing ? null : obj.id)}
                      >
                        {isEditing ? 'Done' : 'Edit'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-warning"
                      style={{ minHeight: '36px', fontSize: '13px' }}
                      onClick={() => {
                        dispatch(selectOnly(obj.id));
                        dispatch(setShowDeleteConfirm(true));
                      }}
                    >
                      Delete
                    </button>
                  </span>
                </div>

                {!isEditing && obj.type === 'note' && (
                  <p className="mt-2 whitespace-pre-wrap break-words" style={{ fontSize: '15px', lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
                    {obj.text || 'No text yet'}
                  </p>
                )}
                {!isEditing && obj.type === 'flashcard' && (
                  <div className="mt-2" style={{ fontSize: '15px', lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
                    <p className="m-0">Front: {obj.front || 'no text yet'}</p>
                    <p className="m-0">Back: {obj.back || 'no text yet'}</p>
                  </div>
                )}

                {isEditing && obj.type === 'note' && (
                  <div className="mt-2">
                    <label
                      htmlFor={`outline-note-${obj.id}`}
                      className="block font-medium mb-1"
                      style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}
                    >
                      Note text
                    </label>
                    <textarea
                      id={`outline-note-${obj.id}`}
                      className="w-full p-2"
                      style={{
                        fontSize: '15px',
                        lineHeight: 1.5,
                        fontFamily: 'inherit',
                        borderRadius: '8px',
                        border: '1.5px solid var(--color-text-secondary)',
                        minHeight: 70,
                      }}
                      value={obj.text || ''}
                      onChange={e =>
                        dispatch(updateObject({ id: obj.id, updates: { text: e.target.value } }))
                      }
                      onKeyDown={e => {
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                  </div>
                )}
                {isEditing && obj.type === 'flashcard' && (
                  <div className="mt-2 flex flex-col gap-2">
                    <div>
                      <label
                        htmlFor={`outline-front-${obj.id}`}
                        className="block font-medium mb-1"
                        style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}
                      >
                        Front
                      </label>
                      <input
                        id={`outline-front-${obj.id}`}
                        type="text"
                        className="w-full p-2"
                        style={{
                          fontSize: '15px',
                          borderRadius: '8px',
                          border: '1.5px solid var(--color-text-secondary)',
                        }}
                        value={obj.front || ''}
                        onChange={e =>
                          dispatch(updateObject({ id: obj.id, updates: { front: e.target.value } }))
                        }
                        onKeyDown={e => {
                          if (e.key === 'Escape') setEditingId(null);
                          if (e.key === 'Enter') setEditingId(null);
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`outline-back-${obj.id}`}
                        className="block font-medium mb-1"
                        style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}
                      >
                        Back
                      </label>
                      <input
                        id={`outline-back-${obj.id}`}
                        type="text"
                        className="w-full p-2"
                        style={{
                          fontSize: '15px',
                          borderRadius: '8px',
                          border: '1.5px solid var(--color-text-secondary)',
                        }}
                        value={obj.back || ''}
                        onChange={e =>
                          dispatch(updateObject({ id: obj.id, updates: { back: e.target.value } }))
                        }
                        onKeyDown={e => {
                          if (e.key === 'Escape') setEditingId(null);
                          if (e.key === 'Enter') setEditingId(null);
                        }}
                      />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default OutlineView;
