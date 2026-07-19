import React, { useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setShowExport, postStatus } from '../slices/appSlice';
import { NOTE_COLORS, SHAPE_COLORS } from '../slices/appSlice';

const colorName = (hex: string): string => {
  const named = [...NOTE_COLORS, ...SHAPE_COLORS].find(
    c => c.hex.toLowerCase() === hex.toLowerCase()
  );
  return named ? named.name : hex;
};

const ExportModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const boards = useAppSelector(s => s.app.boards);
  const activeBoardId = useAppSelector(s => s.app.activeBoardId);
  const showExport = useAppSelector(s => s.app.showExport);
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const board = boards.find(b => b.id === activeBoardId);

  const exportText = useMemo(() => {
    if (!board) return '';
    const lines: string[] = [];
    lines.push(`Board: ${board.name}`);
    lines.push(`Objects: ${board.objects.length}`);
    lines.push('');
    board.objects.forEach((obj, i) => {
      const n = i + 1;
      if (obj.type === 'note') {
        lines.push(`${n}. Note (${colorName(obj.color)}): ${obj.text || 'no text yet'}`);
      } else if (obj.type === 'flashcard') {
        lines.push(
          `${n}. Flashcard — front: ${obj.front || 'no text yet'} | back: ${
            obj.back || 'no text yet'
          } | showing: ${obj.flipped ? 'back' : 'front'}`
        );
      } else {
        lines.push(`${n}. Shape — ${obj.type} (${colorName(obj.color)})`);
      }
    });
    if (board.connectors.length > 0) {
      lines.push('');
      lines.push(`Connectors: ${board.connectors.length}`);
      board.connectors.forEach((conn, i) => {
        const from = board.objects.find(o => o.id === conn.fromId);
        const to = board.objects.find(o => o.id === conn.toId);
        const describe = (o?: (typeof board.objects)[number]) =>
          !o
            ? 'missing object'
            : o.type === 'note'
              ? `note "${o.text || 'no text yet'}"`
              : o.type === 'flashcard'
                ? `flashcard "${o.front || 'no text yet'}"`
                : `${o.type} shape`;
        lines.push(`${i + 1}. ${describe(from)} to ${describe(to)}`);
      });
    }
    return lines.join('\n');
  }, [board]);

  useEffect(() => {
    if (showExport) {
      restoreRef.current = document.activeElement as HTMLElement | null;
      textareaRef.current?.focus();
    } else {
      restoreRef.current?.focus?.();
    }
  }, [showExport]);

  if (!showExport) return null;

  const close = () => dispatch(setShowExport(false));

  const handleCopy = () => {
    const fallback = () => {
      try {
        textareaRef.current?.select();
        document.execCommand('copy');
        dispatch(postStatus('Board text copied'));
      } catch {
        dispatch(postStatus('Copy is unavailable here — select the text and copy it manually'));
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(exportText)
        .then(() => dispatch(postStatus('Board text copied')))
        .catch(fallback);
    } else {
      fallback();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = modalRef.current?.querySelectorAll<HTMLElement>('textarea, button');
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(33, 29, 58, 0.4)' }}
      onMouseDown={e => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        className="bg-white p-6 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl"
        style={{ borderRadius: '12px' }}
        onKeyDown={handleKeyDown}
      >
        <h2
          id="export-modal-title"
          className="font-semibold"
          style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}
        >
          Text outline of this board
        </h2>
        <label
          htmlFor="export-textarea"
          className="mt-3 mb-1 font-medium"
          style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}
        >
          Board contents
        </label>
        <textarea
          id="export-textarea"
          ref={textareaRef}
          className="flex-1 min-h-[200px] p-3 resize-none"
          style={{
            fontSize: '14px',
            lineHeight: 1.5,
            fontFamily: 'inherit',
            borderRadius: '8px',
            border: '1.5px solid var(--color-text-secondary)',
            backgroundColor: '#FAF9FE',
            color: 'var(--color-text-primary)',
          }}
          value={exportText}
          readOnly
        />
        <div className="flex gap-3 mt-4 justify-end">
          <button type="button" className="btn-secondary" onClick={close}>
            Close
          </button>
          <button type="button" className="btn-primary" onClick={handleCopy}>
            Copy text
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
