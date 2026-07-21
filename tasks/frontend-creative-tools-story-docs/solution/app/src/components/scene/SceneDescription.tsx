import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { editScene, toggleCheckbox } from '@/store';
import { editingSceneIdStore, showToast } from '@/store/ui';
import { renderMarkdownHtml, toggleChecklistLine } from '@/lib/markdown';
import { clsx } from 'clsx';

export function SceneDescription({ sceneId, body }: { sceneId: string; body: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(body);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const editingTarget = useStore(editingSceneIdStore);

  const html = useMemo(() => renderMarkdownHtml(body), [body]);

  // External "Edit Scene" request from the kebab menu.
  useEffect(() => {
    if (editingTarget === sceneId) {
      setEditText(body);
      setIsEditing(true);
      editingSceneIdStore.set(null);
    }
  }, [editingTarget, sceneId, body]);

  useEffect(() => {
    setEditText(body);
  }, [body]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const end = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(end, end);
    }
  }, [isEditing]);

  // Wire rendered checkboxes to their body-source lines (mouse + keyboard).
  useEffect(() => {
    const root = contentRef.current;
    if (!root || isEditing) return;
    const boxes = Array.from(root.querySelectorAll<HTMLInputElement>('input.scene-checkbox'));
    const handlers = boxes.map((box) => {
      const handler = () => {
        const index = Number(box.dataset.cbIndex ?? '0');
        const next = toggleChecklistLine(body, index);
        if (next) toggleCheckbox(sceneId, next);
      };
      box.addEventListener('change', handler);
      return () => box.removeEventListener('change', handler);
    });
    return () => handlers.forEach((off) => off());
  }, [html, body, sceneId, isEditing]);

  const save = () => {
    setIsEditing(false);
    const trimmed = editText.trim();
    if (trimmed === body) return;
    if (trimmed.length < 8) {
      setEditText(body);
      showToast('Description must be at least 8 characters');
      return;
    }
    if (trimmed.length > 2000) {
      setEditText(body);
      showToast('Description must be at most 2,000 characters');
      return;
    }
    editScene(sceneId, { body: trimmed });
    showToast('Description updated');
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        aria-label="Edit scene description"
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            setEditText(body);
            setIsEditing(false);
          } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            save();
          }
        }}
        className={clsx(
          'scene-description is-editing min-h-24 w-full resize-y rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 p-2.5 text-sm leading-relaxed text-gray-800',
          'shadow-inner outline-none transition-colors focus:border-yellow-500 focus:bg-yellow-50'
        )}
      />
    );
  }

  return (
    <div
      ref={contentRef}
      role="button"
      tabIndex={0}
      aria-label="Edit scene description"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('input.scene-checkbox')) return;
        setEditText(body);
        setIsEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setEditText(body);
          setIsEditing(true);
        }
      }}
      className={clsx(
        'scene-description md-body cursor-text rounded-lg p-1.5 text-sm leading-relaxed text-gray-600 transition-colors',
        'hover:bg-yellow-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400'
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
