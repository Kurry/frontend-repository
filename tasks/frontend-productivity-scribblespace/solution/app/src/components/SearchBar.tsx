import React from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setSearchQuery, setCanvasView } from '../slices/appSlice';

const SearchBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(s => s.app.searchQuery);
  const searchMatchIds = useAppSelector(s => s.app.searchMatchIds);
  const boards = useAppSelector(s => s.app.boards);
  const activeBoardId = useAppSelector(s => s.app.activeBoardId);
  const canvasView = useAppSelector(s => s.app.canvasView);

  const board = boards.find(b => b.id === activeBoardId);

  const panToFirstMatch = (query: string) => {
    if (!query.trim() || !board) return;
    const q = query.trim().toLowerCase();
    const firstMatch = board.objects.find(o => {
      if (o.type === 'note') return (o.text || '').toLowerCase().includes(q);
      if (o.type === 'flashcard') {
        return (
          (o.front || '').toLowerCase().includes(q) || (o.back || '').toLowerCase().includes(q)
        );
      }
      return false;
    });
    if (firstMatch) {
      const centerX = firstMatch.x + firstMatch.width / 2;
      const centerY = firstMatch.y + firstMatch.height / 2;
      dispatch(
        setCanvasView({
          ...canvasView,
          panX: -(centerX * canvasView.zoom - window.innerWidth / 2),
          panY: -(centerY * canvasView.zoom - (window.innerHeight - 180) / 2),
        })
      );
    }
  };

  const handleChange = (value: string) => {
    dispatch(setSearchQuery(value));
    panToFirstMatch(value);
  };

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="board-search-input"
        className="font-medium"
        style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}
      >
        Search
      </label>
      <div className="relative flex items-center">
        <input
          id="board-search-input"
          type="text"
          className="px-3 bg-white"
          style={{
            width: 'min(210px, 45vw)',
            minHeight: '44px',
            fontSize: '14px',
            borderRadius: '8px',
            border: '1.5px solid var(--color-text-secondary)',
            color: 'var(--color-text-primary)',
          }}
          placeholder="Note or flashcard text"
          value={searchQuery}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') panToFirstMatch(searchQuery);
            if (e.key === 'Escape') dispatch(setSearchQuery(''));
          }}
        />
      </div>
      {searchQuery.trim() && searchMatchIds.length > 0 && (
        <span
          className="whitespace-nowrap font-medium"
          style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}
        >
          {searchMatchIds.length === 1 ? '1 match' : `${searchMatchIds.length} matches`}
        </span>
      )}
    </div>
  );
};

export default SearchBar;
