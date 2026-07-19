import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  addBoard,
  renameBoard,
  requestDeleteBoard,
  deleteBoard,
  setActiveBoard,
} from '../slices/appSlice';
import ConfirmDialog from './ConfirmDialog';

const BoardSwitcher: React.FC = () => {
  const dispatch = useAppDispatch();
  const boards = useAppSelector(s => s.app.boards);
  const activeBoardId = useAppSelector(s => s.app.activeBoardId);
  const boardDeleteId = useAppSelector(s => s.app.boardDeleteId);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const renameButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (renamingId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renamingId]);

  const startRename = (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      setRenamingId(boardId);
      setRenameValue(board.name);
      setRenameError('');
    }
  };

  const saveRename = () => {
    if (!renamingId) return;
    if (!renameValue.trim()) {
      setRenameError('Name is empty. Enter a board name to save it.');
      return;
    }
    if (renameValue.trim().length > 60) {
      setRenameError('Name is too long. Use 60 characters or fewer.');
      return;
    }
    dispatch(renameBoard({ boardId: renamingId, name: renameValue }));
    setRenamingId(null);
    setRenameError('');
    renameButtonRef.current?.focus();
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameError('');
    renameButtonRef.current?.focus();
  };

  const boardToDelete = boards.find(b => b.id === boardDeleteId);

  return (
    <nav className="flex flex-wrap items-center gap-1 min-w-0" aria-label="Boards">
      {boards.map(board => {
        const isActive = board.id === activeBoardId;
        return (
          <div key={board.id} className="relative flex items-center gap-0.5">
            <button
              type="button"
              aria-pressed={isActive}
              className="font-medium whitespace-nowrap"
              style={{
                fontSize: '14px',
                minHeight: '48px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1.5px solid transparent',
                cursor: 'pointer',
                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
                transition: 'background-color 120ms ease, color 120ms ease',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.backgroundColor = '#EAE6F7';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => dispatch(setActiveBoard(board.id))}
            >
              {board.name}
            </button>
            {isActive && (
              <>
                <button
                  ref={renameButtonRef}
                  type="button"
                  aria-label={`Rename board ${board.name}`}
                  title="Rename board"
                  className="flex items-center justify-center hover:bg-[#EAE6F7]"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                  }}
                  onClick={() => startRename(board.id)}
                >
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M11.5 2.5 L13.5 4.5 L5.5 12.5 L2.5 13.5 L3.5 10.5 Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label={`Delete board ${board.name}`}
                  title="Delete board"
                  className="flex items-center justify-center hover:bg-[#EAE6F7]"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-warning)',
                    background: '#FFF8E8',
                    cursor: 'pointer',
                    color: '#7A4A00',
                  }}
                  onClick={() => dispatch(requestDeleteBoard(board.id))}
                >
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </>
            )}
            {renamingId === board.id && (
              <div
                className="absolute top-full left-0 mt-1 bg-white shadow-lg p-3 z-50"
                style={{ borderRadius: '8px', border: '1.5px solid var(--color-text-secondary)', minWidth: '220px' }}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    cancelRename();
                  }
                }}
              >
                <label
                  htmlFor="board-rename-input"
                  className="block font-medium mb-1"
                  style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}
                >
                  Board name
                </label>
                <input
                  id="board-rename-input"
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  aria-invalid={!!renameError}
                  aria-describedby={renameError ? 'board-rename-error' : undefined}
                  className="w-full px-2 py-1.5"
                  style={{
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-text-secondary)',
                    color: 'var(--color-text-primary)',
                  }}
                  onChange={e => {
                    setRenameValue(e.target.value);
                    if (renameError) setRenameError('');
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveRename();
                  }}
                />
                {renameError && (
                  <p id="board-rename-error" role="alert" className="mt-1" style={{ fontSize: '12px', color: '#A4541B', fontWeight: 600 }}>
                    {renameError}
                  </p>
                )}
                <div className="flex gap-2 mt-2 justify-end">
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ minHeight: '36px', fontSize: '13px' }}
                    onClick={cancelRename}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ minHeight: '36px', fontSize: '13px' }}
                    onClick={saveRename}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button type="button" className="btn-primary" onClick={() => dispatch(addBoard())}>
        New Board
      </button>

      {boardToDelete && (
        <ConfirmDialog
          title={`Delete board ${boardToDelete.name}?`}
          body="This deletes the board with everything on it. Another board opens in its place."
          confirmLabel="Delete"
          onConfirm={() => dispatch(deleteBoard(boardToDelete.id))}
          onCancel={() => dispatch(requestDeleteBoard(null))}
        />
      )}
    </nav>
  );
};

export default BoardSwitcher;
