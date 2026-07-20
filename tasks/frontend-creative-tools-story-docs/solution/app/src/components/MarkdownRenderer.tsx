import React, { useMemo } from 'react';
import { marked } from 'marked';
import { updateScene } from '../store';

interface Props {
  content: string;
  sceneId: string;
}

export function MarkdownRenderer({ content, sceneId }: Props) {
  const html = useMemo(() => {
    try {
      marked.setOptions({
        gfm: true,
        breaks: true
      });
      return marked.parse(content) as string;
    } catch (e) {
      return content;
    }
  }, [content]);

  const handleContentClick = (e: React.MouseEvent) => {
    // Check if click was on a checkbox
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'input' && target.getAttribute('type') === 'checkbox') {
      const isChecked = (target as HTMLInputElement).checked;

      // Find which checkbox was clicked
      const container = e.currentTarget;
      const checkboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
      const index = checkboxes.indexOf(target as HTMLInputElement);

      if (index !== -1) {
        // Find corresponding markdown checkbox and toggle it
        let count = 0;
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].match(/- \[[ xX]\]/)) {
            if (count === index) {
              if (lines[i].includes('- [ ]')) {
                lines[i] = lines[i].replace('- [ ]', '- [x]');
              } else {
                lines[i] = lines[i].replace(/- \[[xX]\]/, '- [ ]');
              }
              break;
            }
            count++;
          }
        }

        const newBody = lines.join('\n');
        // Crucial: recordHistory = false for checkbox toggles per spec
        updateScene(sceneId, { body: newBody }, false);
      }
    }
  };

  return (
    <div
      className="markdown-body prose prose-sm max-w-none text-gray-700"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleContentClick}
    />
  );
}

export function getChecklistStats(content: string) {
  if (!content) return null;
  const items = content.match(/- \[[ xX]\]/g);
  if (!items || items.length === 0) return null;

  const completed = items.filter(item => /- \[[xX]\]/.test(item)).length;
  return { total: items.length, completed };
}
